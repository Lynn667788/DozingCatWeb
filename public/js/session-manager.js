const SessionManager = {
    SESSION_KEY: 'userSession',
    ACTIVITY_KEY: 'lastActivity',
    SESSION_TIMEOUT: 60 * 60 * 1000,
    
    init() {
        this.addAnimationStyles();
        this.getSessionData();
        this.setupActivityListeners();
        this.setupVisibilityListeners();
    },
    
    addAnimationStyles() {
        if (document.getElementById('session-manager-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'session-manager-styles';
        style.textContent = `
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            @keyframes slideUp {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    login(userData) {
        const sessionData = {
            isLoggedIn: true,
            userData: userData,
            loginTime: Date.now(),
            lastActivity: Date.now()
        };
        
        try {
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        } catch (e) {
            console.error('Error saving to sessionStorage:', e);
            throw new Error('无法保存会话数据，请检查浏览器隐私设置');
        }
        
        try {
            localStorage.setItem(this.ACTIVITY_KEY, Date.now().toString());
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
        
        try {
            localStorage.setItem(this.SESSION_KEY + '_backup', JSON.stringify(sessionData));
        } catch (e) {
            console.error('Error saving backup to localStorage:', e);
        }
        
        this.setupActivityListeners();
    },
    
    logout() {
        const sessionData = this.getSessionData();
        
        sessionStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem(this.ACTIVITY_KEY);
        localStorage.removeItem(this.SESSION_KEY + '_backup');
        
        this.clearActivityListeners();
        
        if (typeof window.onLogout === 'function') {
            window.onLogout();
        }
        
        console.log('User logged out. Session data:', sessionData);
    },
    
    isLoggedIn() {
        const sessionData = this.getSessionData();
        return sessionData && sessionData.isLoggedIn;
    },
    
    getSessionData() {
        try {
            let sessionStr = sessionStorage.getItem(this.SESSION_KEY);
            
            if (!sessionStr) {
                sessionStr = localStorage.getItem(this.SESSION_KEY + '_backup');
                if (sessionStr) {
                    sessionStorage.setItem(this.SESSION_KEY, sessionStr);
                }
            }
            
            if (sessionStr) {
                return JSON.parse(sessionStr);
            }
            return null;
        } catch (error) {
            console.error('Error reading session data:', error);
            return null;
        }
    },
    
    getUserData() {
        const sessionData = this.getSessionData();
        return sessionData ? sessionData.userData : null;
    },
    
    updateActivity() {
        const now = Date.now();
        localStorage.setItem(this.ACTIVITY_KEY, now.toString());
        
        const sessionData = this.getSessionData();
        if (sessionData) {
            sessionData.lastActivity = now;
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        }
    },
    
    checkSession() {
        const sessionData = this.getSessionData();
        
        console.log('checkSession - sessionData:', sessionData);
        
        if (!sessionData || !sessionData.isLoggedIn) {
            console.log('checkSession - No valid session found');
            return false;
        }
        
        const lastActivity = sessionData.lastActivity || sessionData.loginTime;
        const timeSinceActivity = Date.now() - lastActivity;
        
        console.log('checkSession - Time since activity:', timeSinceActivity, 'Timeout:', this.SESSION_TIMEOUT);
        
        if (timeSinceActivity > this.SESSION_TIMEOUT) {
            console.log('checkSession - Session timeout, logging out');
            this.showSessionTimeoutMessage();
            this.logout();
            return false;
        }
        
        console.log('checkSession - Session valid');
        return true;
    },
    
    showSessionTimeoutMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4444;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: 'Noto Sans SC', sans-serif;
            font-size: 14px;
            font-weight: 500;
            animation: slideDown 0.3s ease;
        `;
        message.textContent = '会话已超时，为了安全起见已自动退出登录';
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    },
    
    setupActivityListeners() {
        this.clearActivityListeners();
        
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 
            'touchstart', 'click', 'keydown'
        ];
        
        this.activityHandler = this.debounce(() => {
            this.updateActivity();
        }, 1000);
        
        events.forEach(event => {
            document.addEventListener(event, this.activityHandler, { passive: true });
        });
    },
    
    clearActivityListeners() {
        if (this.activityHandler) {
            const events = [
                'mousedown', 'mousemove', 'keypress', 'scroll', 
                'touchstart', 'click', 'keydown'
            ];
            
            events.forEach(event => {
                document.removeEventListener(event, this.activityHandler);
            });
        }
    },
    
    setupVisibilityListeners() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('Page became visible, checking session...');
            }
        });
        
        window.addEventListener('beforeunload', (e) => {
            const sessionData = this.getSessionData();
            if (sessionData && sessionData.isLoggedIn) {
                console.log('Page is about to unload, keeping session alive');
            }
        });
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    extendSession() {
        this.updateActivity();
    },
    
    getSessionInfo() {
        const sessionData = this.getSessionData();
        if (!sessionData) {
            return null;
        }
        
        const loginTime = new Date(sessionData.loginTime);
        const lastActivity = new Date(sessionData.lastActivity);
        const sessionDuration = Date.now() - sessionData.loginTime;
        const idleTime = Date.now() - sessionData.lastActivity;
        
        return {
            isLoggedIn: sessionData.isLoggedIn,
            loginTime: loginTime,
            lastActivity: lastActivity,
            sessionDuration: sessionDuration,
            idleTime: idleTime,
            userData: sessionData.userData
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SessionManager.init();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}