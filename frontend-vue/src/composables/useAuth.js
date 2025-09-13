import { ref, computed, onMounted } from 'vue'

const user = ref(null)
const token = ref(null)
const isAuthenticated = ref(false)
const isLoading = ref(false)

export function useAuth() {
  
  const login = async (fingerprintData) => {
    try {
      isLoading.value = true
      
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprint: fingerprintData.base64Image,
          timestamp: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Set authentication state
        user.value = result.user
        token.value = result.token
        isAuthenticated.value = true
        
        // Persist to localStorage
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userToken', result.token)
        localStorage.setItem('userInfo', JSON.stringify(result.user))
        localStorage.setItem('loginTime', new Date().toISOString())
        
        return { success: true, user: result.user, message: result.message }
      } else {
        return { success: false, message: result.message }
      }
      
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        message: 'Authentication service error. Please try again.' 
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const logout = async () => {
    try {
      isLoading.value = true
      
      // Call logout API
      await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        }
      })
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Clear state regardless of API result
      user.value = null
      token.value = null
      isAuthenticated.value = false
      
      // Clear localStorage
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userToken')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('loginTime')
      
      isLoading.value = false
    }
  }
  
  const register = async (registrationData) => {
    try {
      isLoading.value = true
      
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Store registration info locally for demo
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]')
        users.push(result.user)
        localStorage.setItem('registeredUsers', JSON.stringify(users))
        
        return { success: true, user: result.user, message: result.message }
      } else {
        return { success: false, message: result.message }
      }
      
    } catch (error) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        message: 'Registration service error. Please try again.' 
      }
    } finally {
      isLoading.value = false
    }
  }
  
  const checkAuthStatus = () => {
    const storedAuth = localStorage.getItem('isAuthenticated')
    const storedToken = localStorage.getItem('userToken')
    const storedUser = localStorage.getItem('userInfo')
    
    if (storedAuth === 'true' && storedToken && storedUser) {
      try {
        isAuthenticated.value = true
        token.value = storedToken
        user.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('Error parsing stored user info:', error)
        logout() // Clear invalid data
      }
    }
  }
  
  const getUserInfo = computed(() => {
    return user.value ? {
      id: user.value.id,
      name: user.value.name,
      email: user.value.email,
      loginTime: localStorage.getItem('loginTime')
    } : null
  })
  
  const isTokenValid = computed(() => {
    // Simple token validation - in a real app, check expiration
    return token.value && isAuthenticated.value
  })
  
  // Initialize auth state on composable creation
  onMounted(() => {
    checkAuthStatus()
  })
  
  // Auto-check auth state if composable is used without mounting
  if (typeof window !== 'undefined') {
    checkAuthStatus()
  }
  
  return {
    // State
    user: computed(() => user.value),
    token: computed(() => token.value),
    isAuthenticated: computed(() => isAuthenticated.value),
    isLoading: computed(() => isLoading.value),
    userInfo: getUserInfo,
    isTokenValid,
    
    // Methods
    login,
    logout,
    register,
    checkAuthStatus
  }
}