const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/products';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

app.post('/api/products', upload.single('image'), (req, res) => {
  const { name, description, price, stock } = req.body;
  const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;

  const sql = 'INSERT INTO products (name, description, price, stock, image) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [name, description, price, stock, imagePath], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name, description, price, stock, image: imagePath });
  });
});

app.put('/api/products/:id', upload.single('image'), (req, res) => {
  const { name, description, price, stock } = req.body;
  const imagePath = req.file ? `/uploads/products/${req.file.filename}` : req.body.existingImage;

  const sql = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image = ? WHERE id = ?';
  db.run(sql, [name, description, price, stock, imagePath, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: req.params.id, name, description, price, stock, image: imagePath });
  });
});

app.delete('/api/products/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

app.post('/api/orders', (req, res) => {
  const { customerName, customerEmail, customerPhone, address, items, totalAmount } = req.body;

  const sql = 'INSERT INTO orders (customer_name, customer_email, customer_phone, address, items, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.run(sql, [customerName, customerEmail, customerPhone, address, JSON.stringify(items), totalAmount, 'pending'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    items.forEach(item => {
      db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.id]);
    });

    res.json({ orderId: this.lastID, status: 'pending' });
  });
});

app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/orders/:id', (req, res) => {
  db.get('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: req.params.id, status });
  });
});

app.post('/api/payment', (req, res) => {
  const { orderId, paymentMethod, amount } = req.body;

  const sql = 'INSERT INTO payments (order_id, payment_method, amount, status) VALUES (?, ?, ?, ?)';
  db.run(sql, [orderId, paymentMethod, amount, 'completed'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    db.run('UPDATE orders SET status = ? WHERE id = ?', ['paid', orderId]);

    res.json({ paymentId: this.lastID, status: 'completed' });
  });
});

app.get('/api/payments', (req, res) => {
  db.all('SELECT * FROM payments', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/shipping-bot/trigger', async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const shippingResult = await processShipping(order);

    db.run('UPDATE orders SET status = ? WHERE id = ?', ['shipped', orderId]);

    res.json({
      orderId,
      status: 'shipped',
      trackingNumber: shippingResult.trackingNumber,
      estimatedDelivery: shippingResult.estimatedDelivery
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function processShipping(order) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const trackingNumber = 'TRK' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

      resolve({
        trackingNumber,
        estimatedDelivery: estimatedDelivery.toISOString()
      });
    }, 2000);
  });
}

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});