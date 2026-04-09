let cart = [];
let products = [];

async function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`.nav-links a[onclick*="${pageName}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    document.getElementById(`${pageName}-page`).classList.remove('hidden');

    if (pageName === 'products') {
        await loadProducts();
    } else if (pageName === 'cart') {
        renderCart();
    } else if (pageName === 'admin') {
        await loadAdminProducts();
        await loadAdminOrders();
        await loadShippingQueue();
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        renderProducts();
    } catch (error) {
        showNotification('加载产品失败', 'error');
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.image ? `<img src="${product.image}" alt="${product.name}" class="product-image">` : '<div class="product-image"></div>'}
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-price">¥${product.price.toFixed(2)}</div>
                <div class="product-stock">库存: ${product.stock}</div>
                <button onclick="addToCart(${product.id})" class="btn btn-primary" ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock > 0 ? '加入购物车' : '缺货'}
                </button>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            showNotification('库存不足', 'error');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
        });
    }

    updateCartCount();
    showNotification('已添加到购物车');
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = `(${count})`;
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>购物车为空</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>¥${item.price.toFixed(2)} × ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <button onclick="updateQuantity(${item.id}, -1)" class="btn btn-secondary">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" class="btn btn-secondary">+</button>
                    <button onclick="removeFromCart(${item.id})" class="btn btn-danger">删除</button>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('cart-total').textContent = total.toFixed(2);
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else if (newQuantity <= product.stock) {
        item.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
    } else {
        showNotification('库存不足', 'error');
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

function showCheckout() {
    if (cart.length === 0) {
        showNotification('购物车为空', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('checkout-total').textContent = total.toFixed(2);
    showPage('checkout');
}

async function submitOrder(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const orderData = {
        customerName: formData.get('customerName'),
        customerEmail: formData.get('customerEmail'),
        customerPhone: formData.get('customerPhone'),
        address: formData.get('address'),
        items: cart,
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        await fetch('/api/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: result.orderId,
                paymentMethod: formData.get('paymentMethod'),
                amount: orderData.totalAmount
            })
        });

        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showNotification('订单提交成功！');
        showPage('home');
    } catch (error) {
        showNotification('订单提交失败', 'error');
    }
}

async function addProduct(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showNotification('产品添加成功！');
            form.reset();
            await loadAdminProducts();
        } else {
            showNotification('产品添加失败', 'error');
        }
    } catch (error) {
        showNotification('产品添加失败', 'error');
    }
}

async function loadAdminProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        renderAdminProducts(products);
    } catch (error) {
        showNotification('加载产品失败', 'error');
    }
}

function renderAdminProducts(products) {
    const list = document.getElementById('admin-products-list');
    list.innerHTML = products.map(product => `
        <div class="admin-product-item">
            <h4>${product.name}</h4>
            <p>价格: ¥${product.price.toFixed(2)} | 库存: ${product.stock}</p>
            <button onclick="deleteProduct(${product.id})" class="btn btn-danger">删除</button>
        </div>
    `).join('');
}

async function deleteProduct(productId) {
    if (!confirm('确定要删除这个产品吗？')) return;

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('产品删除成功！');
            await loadAdminProducts();
        } else {
            showNotification('产品删除失败', 'error');
        }
    } catch (error) {
        showNotification('产品删除失败', 'error');
    }
}

async function loadAdminOrders() {
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();
        renderAdminOrders(orders);
    } catch (error) {
        showNotification('加载订单失败', 'error');
    }
}

function renderAdminOrders(orders) {
    const list = document.getElementById('admin-orders-list');
    list.innerHTML = orders.map(order => `
        <div class="admin-order-item">
            <h4>订单 #${order.id}</h4>
            <p>客户: ${order.customer_name}</p>
            <p>金额: ¥${order.total_amount.toFixed(2)}</p>
            <p>状态: <span class="status-badge status-${order.status}">${order.status}</span></p>
            <p>地址: ${order.address}</p>
        </div>
    `).join('');
}

async function loadShippingQueue() {
    try {
        const response = await fetch('/api/orders');
        const orders = await response.json();
        const pendingOrders = orders.filter(order => order.status === 'paid');
        renderShippingQueue(pendingOrders);
    } catch (error) {
        showNotification('加载发货队列失败', 'error');
    }
}

function renderShippingQueue(orders) {
    const queue = document.getElementById('shipping-queue');
    if (orders.length === 0) {
        queue.innerHTML = '<p>没有待发货的订单</p>';
    } else {
        queue.innerHTML = orders.map(order => `
            <div class="shipping-item">
                <h4>订单 #${order.id}</h4>
                <p>客户: ${order.customer_name}</p>
                <p>地址: ${order.address}</p>
                <button onclick="triggerShippingBot(${order.id})" class="btn btn-primary">触发智能发货</button>
            </div>
        `).join('');
    }
}

async function triggerShippingBot(orderId) {
    try {
        showNotification('智能发货机器人正在处理...');

        const response = await fetch('/api/shipping-bot/trigger', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderId })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(`发货成功！物流单号: ${result.trackingNumber}`);
            await loadShippingQueue();
            await loadAdminOrders();
        } else {
            showNotification('发货失败', 'error');
        }
    } catch (error) {
        showNotification('发货失败', 'error');
    }
}

function showAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('hidden');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`admin-${tabName}`).classList.add('active');
    document.getElementById(`admin-${tabName}`).classList.remove('hidden');
    event.target.classList.add('active');
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type === 'error' ? 'error' : ''}`;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
});