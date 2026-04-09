const UserDataManager = {
    USER_DATA_KEY: 'userData',
    AVATAR_KEY: 'memberAvatar',
    PREFERENCES_KEY: 'userPreferences',
    
    init() {
        this.ensureUserDataExists();
    },
    
    ensureUserDataExists() {
        const userData = this.getUserData();
        if (!userData) {
            this.createDefaultUserData();
        }
    },
    
    createDefaultUserData() {
        const defaultData = {
            avatar: '🐱',
            preferences: {
                theme: 'light',
                language: 'zh',
                currency: 'CNY'
            },
            profile: {
                name: '',
                email: '',
                phone: '',
                address: ''
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.saveUserData(defaultData);
        console.log('Created default user data:', defaultData);
    },
    
    getUserData() {
        try {
            const userDataStr = localStorage.getItem(this.USER_DATA_KEY);
            if (userDataStr) {
                return JSON.parse(userDataStr);
            }
            return null;
        } catch (error) {
            console.error('Error reading user data:', error);
            return null;
        }
    },
    
    saveUserData(userData) {
        try {
            userData.updatedAt = new Date().toISOString();
            localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
            console.log('User data saved:', userData);
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    },
    
    updateAvatar(avatar) {
        console.log('UserDataManager.updateAvatar called with avatar length:', avatar ? avatar.length : 0);
        
        const userData = this.getUserData() || this.createDefaultUserData();
        userData.avatar = avatar;
        userData.updatedAt = new Date().toISOString();
        
        try {
            localStorage.setItem(this.AVATAR_KEY, avatar);
            this.saveUserData(userData);
            
            const savedAvatar = localStorage.getItem(this.AVATAR_KEY);
            console.log('Avatar saved successfully, verified:', savedAvatar ? savedAvatar.length : 0);
            console.log('Avatar updated:', avatar);
        } catch (error) {
            console.error('Error saving avatar:', error);
            if (error.name === 'QuotaExceededError') {
                alert('图片太大，无法保存。请选择较小的图片（建议小于500KB）');
            } else {
                alert('头像保存失败：' + error.message);
            }
        }
    },
    
    getAvatar() {
        return localStorage.getItem(this.AVATAR_KEY) || '🐱';
    },
    
    updateProfile(profileData) {
        const userData = this.getUserData() || this.createDefaultUserData();
        userData.profile = { ...userData.profile, ...profileData };
        userData.updatedAt = new Date().toISOString();
        
        this.saveUserData(userData);
        
        console.log('Profile updated:', profileData);
    },
    
    getProfile() {
        const userData = this.getUserData();
        return userData ? userData.profile : null;
    },
    
    updatePreferences(preferences) {
        const userData = this.getUserData() || this.createDefaultUserData();
        userData.preferences = { ...userData.preferences, ...preferences };
        userData.updatedAt = new Date().toISOString();
        
        this.saveUserData(userData);
        
        console.log('Preferences updated:', preferences);
    },
    
    getPreferences() {
        const userData = this.getUserData();
        return userData ? userData.preferences : null;
    },
    
    clearUserData() {
        localStorage.removeItem(this.USER_DATA_KEY);
        localStorage.removeItem(this.AVATAR_KEY);
        localStorage.removeItem(this.PREFERENCES_KEY);
        console.log('User data cleared');
    },
    
    exportUserData() {
        const userData = this.getUserData();
        if (userData) {
            const dataStr = JSON.stringify(userData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dozingcat-user-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('User data exported');
        }
    },
    
    importUserData(jsonData) {
        try {
            const userData = JSON.parse(jsonData);
            
            if (!userData.avatar || !userData.preferences) {
                throw new Error('Invalid user data format');
            }
            
            userData.updatedAt = new Date().toISOString();
            this.saveUserData(userData);
            
            if (userData.avatar) {
                localStorage.setItem(this.AVATAR_KEY, userData.avatar);
            }
            
            console.log('User data imported:', userData);
            return true;
        } catch (error) {
            console.error('Error importing user data:', error);
            return false;
        }
    },
    
    getUserDataInfo() {
        const userData = this.getUserData();
        if (!userData) {
            return null;
        }
        
        return {
            hasAvatar: !!userData.avatar,
            hasProfile: !!userData.profile && Object.keys(userData.profile).length > 0,
            hasPreferences: !!userData.preferences,
            createdAt: userData.createdAt,
            lastUpdated: userData.updatedAt,
            dataAge: Date.now() - new Date(userData.updatedAt).getTime()
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UserDataManager.init();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserDataManager;
}