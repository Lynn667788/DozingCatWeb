-- Supabase 数据库表结构
-- 在 Supabase SQL Editor 中执行此文件

-- 1. 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    avatar TEXT DEFAULT '🐱',
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 产品表 (products)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    image TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 购物车表 (cart_items)
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    is_selected BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 订单表 (orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    address TEXT,
    items JSONB,
    total_amount DECIMAL(10, 2),
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    tracking_number TEXT,
    estimated_delivery TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. 创建索引
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- 6. 启用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 7. RLS 策略 - 用户只能查看和编辑自己的数据
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Users can view their own cart" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart" ON cart_items
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 8. 插入默认管理员账号 (密码: admin123)
INSERT INTO users (email, password, name, role)
VALUES ('admin@dozingcat.com', 'admin123', '管理员', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 9. 插入示例产品
INSERT INTO products (name, description, price, stock, category, is_active)
VALUES 
    ('猫咪毛绒玩具', '超可爱的猫咪毛绒玩具，柔软舒适', 99.00, 50, 'pets', TRUE),
    ('猫爪抱枕', 'Q弹猫爪造型抱枕，治愈系好物', 129.00, 30, 'pets', TRUE),
    ('猫咪主题笔记本', '精美猫咪图案笔记本', 49.00, 100, 'life', TRUE),
    ('限量版猫咪摆件', '独家设计限量款猫咪摆件', 299.00, 20, 'limited', TRUE),
    ('猫咪主题马克杯', '可爱猫咪造型陶瓷马克杯', 79.00, 60, 'life', TRUE)
ON CONFLICT DO NOTHING;
