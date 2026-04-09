const SecurityUtils = {
    encryptionKey: 'DozingCat-Secure-Key-2024',
    
    encrypt(data) {
        try {
            const jsonString = JSON.stringify(data);
            const encoded = btoa(encodeURIComponent(jsonString));
            const key = this.encryptionKey;
            let encrypted = '';
            
            for (let i = 0; i < encoded.length; i++) {
                const charCode = encoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                encrypted += String.fromCharCode(charCode);
            }
            
            return btoa(encrypted);
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    },
    
    decrypt(encryptedData) {
        try {
            const key = this.encryptionKey;
            const decoded = atob(encryptedData);
            let decrypted = '';
            
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
                decrypted += String.fromCharCode(charCode);
            }
            
            const jsonString = decodeURIComponent(atob(decrypted));
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    },
    
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .replace(/data:/gi, '')
            .trim();
    },
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    validatePhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    },
    
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
            strength: this.getPasswordStrength(password),
            errors: this.getPasswordErrors(password, minLength, hasUpperCase, hasLowerCase, hasNumbers)
        };
    },
    
    getPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/\d/.test(password)) strength += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
        
        if (strength <= 2) return 'weak';
        if (strength <= 4) return 'medium';
        return 'strong';
    },
    
    getPasswordErrors(password, minLength, hasUpperCase, hasLowerCase, hasNumbers) {
        const errors = [];
        if (password.length < minLength) errors.push(`密码长度至少${minLength}位`);
        if (!hasUpperCase) errors.push('密码需要包含大写字母');
        if (!hasLowerCase) errors.push('密码需要包含小写字母');
        if (!hasNumbers) errors.push('密码需要包含数字');
        return errors;
    },
    
    generateSecureToken() {
        const array = new Uint32Array(4);
        crypto.getRandomValues(array);
        return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
    },
    
    hashPassword(password) {
        let hash = 0;
        const salt = this.generateSecureToken();
        
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return btoa(hash.toString() + salt);
    },
    
    maskSensitiveData(data, type) {
        if (!data) return '';
        
        switch (type) {
            case 'phone':
                return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
            case 'email':
                const [username, domain] = data.split('@');
                const maskedUsername = username.substring(0, 2) + '***' + username.substring(username.length - 1);
                return maskedUsername + '@' + domain;
            case 'card':
                return data.replace(/\d(?=\d{4})/g, '*');
            case 'bank':
                return data.replace(/(\d{4})\d+(\d{4})/, '$1********$2');
            default:
                return data.substring(0, 2) + '***' + data.substring(data.length - 2);
        }
    },
    
    secureLocalStorage: {
        setItem(key, value) {
            try {
                const encrypted = SecurityUtils.encrypt(value);
                if (encrypted) {
                    localStorage.setItem(key, encrypted);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Secure storage error:', error);
                return false;
            }
        },
        
        getItem(key) {
            try {
                const encrypted = localStorage.getItem(key);
                if (encrypted) {
                    return SecurityUtils.decrypt(encrypted);
                }
                return null;
            } catch (error) {
                console.error('Secure storage error:', error);
                return null;
            }
        },
        
        removeItem(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Secure storage error:', error);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Secure storage error:', error);
                return false;
            }
        }
    },
    
    addSecurityHeaders() {
        const metaTags = [
            { name: 'X-Content-Type-Options', content: 'nosniff' },
            { name: 'X-Frame-Options', content: 'DENY' },
            { name: 'X-XSS-Protection', content: '1; mode=block' },
            { name: 'Content-Security-Policy', content: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;" }
        ];
        
        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            meta.httpEquiv = tag.name;
            meta.content = tag.content;
            document.head.appendChild(meta);
        });
    },
    
    preventRightClick() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });
    },
    
    preventDevTools() {
        document.addEventListener('keydown', (e) => {
            if (
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && e.key === 'U') ||
                (e.key === 'F12')
            ) {
                e.preventDefault();
                return false;
            }
        });
    },
    
    logSecurityEvent(event, details) {
        const securityLog = JSON.parse(localStorage.getItem('securityLog') || '[]');
        securityLog.push({
            timestamp: new Date().toISOString(),
            event: event,
            details: details,
            userAgent: navigator.userAgent
        });
        
        if (securityLog.length > 100) {
            securityLog.shift();
        }
        
        localStorage.setItem('securityLog', JSON.stringify(securityLog));
    },
    
    checkSecurity() {
        const checks = {
            https: window.location.protocol === 'https:',
            cookiesEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack === '1',
            secureContext: window.isSecureContext
        };
        
        return checks;
    },
    
    showSecurityBadge() {
        const badge = document.createElement('div');
        badge.className = 'security-badge';
        badge.innerHTML = `
            <div class="security-icon">🔒</div>
            <div class="security-info">
                <div class="security-title">安全保护已启用</div>
                <div class="security-details">所有数据已加密传输</div>
            </div>
        `;
        document.body.appendChild(badge);
        
        setTimeout(() => {
            badge.classList.add('show');
        }, 1000);
        
        setTimeout(() => {
            badge.classList.remove('show');
            setTimeout(() => badge.remove(), 300);
        }, 5000);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityUtils;
}