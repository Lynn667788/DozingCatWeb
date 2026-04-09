const SupabaseManager = {
    currentUser: null,

    async init() {
        this.checkSession();
    },

    async register(email, password, name) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('users')
            .insert([
                {
                    email: email,
                    password: password,
                    name: name || email.split('@')[0],
                    role: 'member'
                }
            ])
            .select();

        if (error) throw error;
        return data[0];
    },

    async login(email, password) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)
            .single();

        if (error) throw error;
        if (!data) throw new Error('账号或密码错误');

        this.currentUser = data;
        localStorage.setItem('supabase_user', JSON.stringify(data));
        return data;
    },

    async adminLogin(username, password) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('users')
            .select('*')
            .eq('email', username)
            .eq('password', password)
            .eq('role', 'admin')
            .single();

        if (error) throw error;
        if (!data) throw new Error('管理员账号或密码错误');

        this.currentUser = data;
        localStorage.setItem('supabase_user', JSON.stringify(data));
        return data;
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('supabase_user');
    },

    checkSession() {
        const userStr = localStorage.getItem('supabase_user');
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
            return this.currentUser;
        }
        return null;
    },

    isLoggedIn() {
        return !!this.currentUser || !!localStorage.getItem('supabase_user');
    },

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    },

    getCurrentUser() {
        if (!this.currentUser) {
            const userStr = localStorage.getItem('supabase_user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
            }
        }
        return this.currentUser;
    },

    async getProducts() {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getAllProducts() {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async addProduct(product) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('products')
            .insert([product])
            .select();

        if (error) throw error;
        return data[0];
    },

    async updateProduct(id, updates) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('products')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async deleteProduct(id) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { error } = await sb
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async getCart() {
        const user = this.getCurrentUser();
        if (!user) return [];

        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('cart_items')
            .select(`
                *,
                products (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async addToCart(productId, quantity = 1) {
        const user = this.getCurrentUser();
        if (!user) throw new Error('请先登录');

        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data: existing, error: checkError } = await sb
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (existing) {
            const { data, error } = await sb
                .from('cart_items')
                .update({ quantity: existing.quantity + quantity })
                .eq('id', existing.id)
                .select();

            if (error) throw error;
            return data[0];
        } else {
            const { data, error } = await sb
                .from('cart_items')
                .insert([{
                    user_id: user.id,
                    product_id: productId,
                    quantity: quantity
                }])
                .select();

            if (error) throw error;
            return data[0];
        }
    },

    async updateCartItem(cartItemId, updates) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('cart_items')
            .update(updates)
            .eq('id', cartItemId)
            .select();

        if (error) throw error;
        return data[0];
    },

    async removeFromCart(cartItemId) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { error } = await sb
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);

        if (error) throw error;
        return true;
    },

    async clearCart() {
        const user = this.getCurrentUser();
        if (!user) throw new Error('请先登录');

        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { error } = await sb
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

        if (error) throw error;
        return true;
    },

    async createOrder(orderData) {
        const user = this.getCurrentUser();
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('orders')
            .insert([{
                user_id: user ? user.id : null,
                customer_name: orderData.customerName,
                customer_email: orderData.customerEmail,
                customer_phone: orderData.customerPhone,
                address: orderData.address,
                items: orderData.items,
                total_amount: orderData.totalAmount,
                status: 'pending',
                payment_status: 'unpaid'
            }])
            .select();

        if (error) throw error;
        return data[0];
    },

    async getOrders() {
        const user = this.getCurrentUser();
        if (!user) return [];

        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getAllOrders() {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async updateOrderStatus(orderId, status) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('orders')
            .update({ status: status })
            .eq('id', orderId)
            .select();

        if (error) throw error;
        return data[0];
    },

    async updatePaymentStatus(orderId, paymentMethod) {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase 未初始化');

        const { data, error } = await sb
            .from('orders')
            .update({
                payment_method: paymentMethod,
                payment_status: 'paid',
                status: 'paid'
            })
            .eq('id', orderId)
            .select();

        if (error) throw error;
        return data[0];
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SupabaseManager.init();
});
