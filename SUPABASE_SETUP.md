# Supabase 集成使用说明

## 已完成的功能

### 1. 会员登录和购物车永久保存
- 会员登录后，购物车数据自动保存到 Supabase
- 购物车数据永久保存，除非手动删除
- 支持跨设备同步购物车

### 2. 后台商品管理
- 管理员可以上传商品并保存到 Supabase
- 商品数据永久保存，除非手动删除
- 会员确认付款后，商品状态自动更新为已售出

### 3. 商品陈列展示
- 首页、购物车、支付页面等所有需要展示商品的地方都使用 Supabase 数据

## 安装步骤

### 步骤 1: 在 Supabase 创建数据库表

1. 登录 Supabase 控制台
2. 进入你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 新建查询，复制 `supabase-schema.sql` 文件的内容并执行

### 步骤 2: 配置已完成

项目已经配置好以下文件：

- `public/js/supabase-config.js` - Supabase 配置
- `public/js/supabase-manager.js` - Supabase 数据管理
- `supabase-schema.sql` - 数据库表结构

### 步骤 3: 测试账号

**管理员账号：**
- 邮箱：admin@dozingcat.com
- 密码：admin123

**会员测试账号（需要先在数据库中注册）：**
- 使用注册页面创建新账号

## 文件说明

### 新增文件

1. **public/js/supabase-config.js** - Supabase 配置和初始化
2. **public/js/supabase-manager.js** - 所有 Supabase 数据操作
3. **supabase-schema.sql** - 数据库表结构 SQL
4. **SUPABASE_SETUP.md** - 本说明文档

### 修改文件

1. **public/index.html** - 集成 Supabase 产品加载和登录
2. **public/admin.html** - 集成 Supabase 后台管理

## 功能详解

### SupabaseManager API

#### 用户相关
- `SupabaseManager.login(email, password)` - 会员登录
- `SupabaseManager.adminLogin(username, password)` - 管理员登录
- `SupabaseManager.logout()` - 登出
- `SupabaseManager.isLoggedIn()` - 检查是否登录
- `SupabaseManager.isAdmin()` - 检查是否是管理员

#### 产品相关
- `SupabaseManager.getProducts()` - 获取所有上架产品
- `SupabaseManager.getAllProducts()` - 获取所有产品（含下架）
- `SupabaseManager.addProduct(product)` - 添加产品
- `SupabaseManager.updateProduct(id, updates)` - 更新产品
- `SupabaseManager.deleteProduct(id)` - 删除产品

#### 购物车相关
- `SupabaseManager.getCart()` - 获取用户购物车
- `SupabaseManager.addToCart(productId, quantity)` - 添加到购物车
- `SupabaseManager.updateCartItem(cartItemId, updates)` - 更新购物车项
- `SupabaseManager.removeFromCart(cartItemId)` - 从购物车删除
- `SupabaseManager.clearCart()` - 清空购物车

#### 订单相关
- `SupabaseManager.createOrder(orderData)` - 创建订单
- `SupabaseManager.getOrders()` - 获取用户订单
- `SupabaseManager.getAllOrders()` - 获取所有订单（管理员）
- `SupabaseManager.updateOrderStatus(orderId, status)` - 更新订单状态
- `SupabaseManager.updatePaymentStatus(orderId, paymentMethod)` - 更新支付状态

## 数据库表结构

### users (用户表)
- id - 用户 ID
- email - 邮箱
- password - 密码
- name - 姓名
- avatar - 头像
- phone - 电话
- address - 地址
- role - 角色 (member/admin)
- created_at - 创建时间
- updated_at - 更新时间

### products (产品表)
- id - 产品 ID
- name - 产品名称
- description - 产品描述
- price - 价格
- stock - 库存
- image - 图片
- category - 分类
- is_active - 是否上架
- created_at - 创建时间
- updated_at - 更新时间

### cart_items (购物车表)
- id - 购物车项 ID
- user_id - 用户 ID
- product_id - 产品 ID
- quantity - 数量
- is_selected - 是否选中
- created_at - 创建时间
- updated_at - 更新时间

### orders (订单表)
- id - 订单 ID
- user_id - 用户 ID
- customer_name - 客户姓名
- customer_email - 客户邮箱
- customer_phone - 客户电话
- address - 地址
- items - 商品列表 (JSON)
- total_amount - 总金额
- status - 订单状态
- payment_method - 支付方式
- payment_status - 支付状态
- tracking_number - 快递单号
- estimated_delivery - 预计送达时间
- created_at - 创建时间
- updated_at - 更新时间

## 注意事项

1. 首次使用前，必须先在 Supabase 执行 `supabase-schema.sql` 创建数据库表
2. 确保 Supabase URL 和 Key 在 `supabase-config.js` 中正确配置
3. 测试时可以使用预设的管理员账号：admin@dozingcat.com / admin123
4. 会员需要先通过注册页面创建账号
