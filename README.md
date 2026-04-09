# DozingCat 电商平台

一个功能完整的电商网站系统，包含产品管理、购物车、支付和智能机器人发货功能。

## 功能特性

### 📦 产品管理
- 上传产品图片和信息
- 管理产品库存
- 产品展示和搜索
- 实时库存更新

### 🛒 购物车系统
- 添加商品到购物车
- 修改商品数量
- 删除商品
- 自动计算总价

### 💳 支付系统
- 支持多种支付方式（支付宝、微信支付、银行卡）
- 安全的支付处理
- 订单状态跟踪

### 🤖 智能发货机器人
- 自动处理已支付订单
- 生成物流单号
- 预计送达时间
- 一键触发发货

### 📊 管理后台
- 产品管理（添加、编辑、删除）
- 订单管理（查看、更新状态）
- 发货管理（智能发货队列）
- 实时数据统计

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite3
- **前端**: 原生 JavaScript + HTML5 + CSS3
- **文件上传**: Multer
- **API**: RESTful API

## 安装和运行

### 前置要求
- Node.js (v14 或更高版本)
- npm (v6 或更高版本)

### 安装步骤

1. 安装依赖
```bash
npm install
```

2. 启动服务器
```bash
npm start
```

3. 访问应用
打开浏览器访问: `http://localhost:3000`

### 开发模式
```bash
npm run dev
```

## 项目结构

```
dozingcat/
├── server.js              # 主服务器文件
├── database.js            # 数据库配置和初始化
├── package.json           # 项目配置和依赖
├── public/                # 前端静态文件
│   ├── index.html         # 主页面
│   ├── css/
│   │   └── style.css      # 样式文件
│   └── js/
│       └── app.js         # 前端逻辑
├── uploads/               # 上传文件存储目录
│   └── products/          # 产品图片
└── ecommerce.db          # SQLite 数据库文件（自动生成）
```

## API 接口

### 产品相关
- `GET /api/products` - 获取所有产品
- `GET /api/products/:id` - 获取单个产品
- `POST /api/products` - 添加新产品
- `PUT /api/products/:id` - 更新产品
- `DELETE /api/products/:id` - 删除产品

### 订单相关
- `GET /api/orders` - 获取所有订单
- `GET /api/orders/:id` - 获取单个订单
- `POST /api/orders` - 创建新订单
- `PUT /api/orders/:id/status` - 更新订单状态

### 支付相关
- `POST /api/payment` - 处理支付
- `GET /api/payments` - 获取支付记录

### 发货相关
- `POST /api/shipping-bot/trigger` - 触发智能发货

## 使用说明

### 添加产品
1. 点击导航栏的"管理后台"
2. 在产品管理页面填写产品信息
3. 上传产品图片（可选）
4. 点击"添加产品"按钮

### 购买商品
1. 浏览产品列表
2. 点击"加入购物车"
3. 在购物车页面确认商品
4. 点击"结算"填写收货信息
5. 选择支付方式并提交订单

### 智能发货
1. 在管理后台进入"发货管理"
2. 查看待发货订单列表
3. 点击"🤖 触发智能发货"按钮
4. 系统自动生成物流单号并更新订单状态

## 数据库结构

### products 表
- id: 产品ID（主键）
- name: 产品名称
- description: 产品描述
- price: 价格
- stock: 库存数量
- image: 产品图片路径
- created_at: 创建时间

### orders 表
- id: 订单ID（主键）
- customer_name: 客户姓名
- customer_email: 客户邮箱
- customer_phone: 客户电话
- address: 收货地址
- items: 订单商品（JSON格式）
- total_amount: 订单总金额
- status: 订单状态
- created_at: 创建时间

### payments 表
- id: 支付ID（主键）
- order_id: 关联订单ID
- payment_method: 支付方式
- amount: 支付金额
- status: 支付状态
- created_at: 创建时间

### shipping 表
- id: 发货ID（主键）
- order_id: 关联订单ID
- tracking_number: 物流单号
- carrier: 物流公司
- status: 发货状态
- estimated_delivery: 预计送达时间
- created_at: 创建时间

## 特色功能

### 智能发货机器人
系统内置智能发货机器人，可以：
- 自动识别待发货订单
- 生成唯一物流单号
- 计算预计送达时间
- 更新订单状态
- 提供发货反馈

### 响应式设计
- 支持桌面端和移动端
- 自适应布局
- 优化的用户体验

### 实时通知
- 操作成功/失败提示
- 库存不足提醒
- 订单状态更新

## 安全性

- 文件上传验证
- SQL注入防护
- XSS防护
- CORS配置

## 扩展建议

1. **用户认证**: 添加用户登录注册功能
2. **支付集成**: 集成真实的支付网关（支付宝、微信支付等）
3. **物流集成**: 对接真实物流公司API
4. **数据分析**: 添加销售统计和数据分析功能
5. **搜索功能**: 实现产品搜索和筛选
6. **评价系统**: 添加商品评价和评分功能

## 许可证

ISC License

## 联系方式

如有问题或建议，请联系开发者。