// API utility functions for fingerprint authentication system

const API_BASE_URL = 'http://localhost:8080/api'

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }
    
    // Add auth token if available
    const token = localStorage.getItem('userToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }
  
  // Authentication endpoints
  async login(fingerprintData) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        fingerprint: fingerprintData.base64Image,
        timestamp: new Date().toISOString(),
        metadata: fingerprintData.metadata || {}
      })
    })
  }
  
  async register(registrationData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData)
    })
  }
  
  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    })
  }
  
  async verifyToken() {
    return this.request('/auth/verify', {
      method: 'GET'
    })
  }
  
  // User management endpoints
  async getUserProfile() {
    return this.request('/user/profile', {
      method: 'GET'
    })
  }
  
  async updateUserProfile(userData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
  }
  
  async getUserFingerprints() {
    return this.request('/user/fingerprints', {
      method: 'GET'
    })
  }
  
  // Fingerprint scanning endpoints
  async triggerScan() {
    return this.request('/trigger-scan', {
      method: 'POST',
      body: JSON.stringify({ action: 'start_scan' })
    })
  }
  
  async getScanStatus() {
    return this.request('/status', {
      method: 'GET'
    })
  }
  
  async getLatestImage() {
    const response = await fetch(`${this.baseURL}/image`)
    if (!response.ok) {
      throw new Error('Failed to load fingerprint image')
    }
    return response.blob()
  }
  
  // Statistics and analytics endpoints
  async getLoginHistory() {
    return this.request('/user/login-history', {
      method: 'GET'
    })
  }
  
  async getSystemStats() {
    return this.request('/admin/stats', {
      method: 'GET'
    })
  }
  
  // Utility methods
  imageToBase64(imgElement) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = imgElement.naturalWidth || imgElement.width
        canvas.height = imgElement.naturalHeight || imgElement.height
        
        ctx.drawImage(imgElement, 0, 0)
        
        const base64 = canvas.toDataURL('image/bmp').split(',')[1]
        resolve(base64)
      } catch (error) {
        reject(error)
      }
    })
  }
  
  async processFingerprint(imageElement) {
    const base64Image = await this.imageToBase64(imageElement)
    return {
      base64Image,
      timestamp: new Date().toISOString(),
      metadata: {
        width: imageElement.naturalWidth || imageElement.width,
        height: imageElement.naturalHeight || imageElement.height,
        quality: 'good' // Mock quality assessment
      }
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient()

// Export individual functions for convenience
export const authApi = {
  login: (fingerprintData) => apiClient.login(fingerprintData),
  register: (registrationData) => apiClient.register(registrationData),
  logout: () => apiClient.logout(),
  verifyToken: () => apiClient.verifyToken()
}

export const userApi = {
  getProfile: () => apiClient.getUserProfile(),
  updateProfile: (userData) => apiClient.updateUserProfile(userData),
  getFingerprints: () => apiClient.getUserFingerprints(),
  getLoginHistory: () => apiClient.getLoginHistory()
}

export const scanApi = {
  trigger: () => apiClient.triggerScan(),
  getStatus: () => apiClient.getScanStatus(),
  getLatestImage: () => apiClient.getLatestImage()
}

export const adminApi = {
  getStats: () => apiClient.getSystemStats()
}

export const utils = {
  imageToBase64: (imgElement) => apiClient.imageToBase64(imgElement),
  processFingerprint: (imageElement) => apiClient.processFingerprint(imageElement)
}

export default apiClient