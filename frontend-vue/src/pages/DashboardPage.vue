<template>
  <div class="dashboard-page">
    <Navigation />
    <div class="container">
      <header class="dashboard-header">
        <h1>📊 User Dashboard</h1>
        <p>Manage and monitor user access statistics</p>
      </header>

      <div class="stats-summary">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalUsers }}</div>
            <div class="stat-label">Total Users</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔑</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalAccess }}</div>
            <div class="stat-label">Total Access</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-number">{{ currentPage }}</div>
            <div class="stat-label">Current Page</div>
          </div>
        </div>
      </div>

      <div class="table-section">
        <div class="table-header">
          <h3>Users List</h3>
          <button @click="refreshData" class="refresh-btn" :disabled="loading">
            <span class="refresh-icon" :class="{ spinning: loading }">🔄</span>
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner">⏳</div>
          <p>Loading users data...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <p>{{ error }}</p>
          <button @click="refreshData" class="retry-btn">Try Again</button>
        </div>

        <div v-else class="table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Access Count</th>
                <th>Last Login</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="user-row">
                <td class="user-name">
                  <div class="name-cell">
                    <span class="user-avatar">👤</span>
                    {{ user.fullName }}
                  </div>
                </td>
                <td class="access-count">
                  <span class="count-badge">{{ user.accessCount }}</span>
                </td>
                <td class="last-login">{{ formatDate(user.lastLogin) }}</td>
                <td class="user-id">{{ formatId(user.id) }}</td>
              </tr>
            </tbody>
          </table>

          <div v-if="users.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <p>No users found</p>
          </div>
        </div>

        <div v-if="users.length > 0" class="pagination-info">
          <p>
            Showing {{ users.length }} of {{ totalCount }} users
            <span v-if="pagesCount > 1">
              (Page {{ currentPage }} of {{ pagesCount }})
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Navigation from '../components/Navigation.vue'

const loading = ref(false)
const error = ref('')
const users = ref([])
const totalCount = ref(0)
const pagesCount = ref(1)
const currentPage = ref(1)

// Computed stats
const totalUsers = computed(() => users.value.length)
const totalAccess = computed(() => 
  users.value.reduce((sum, user) => sum + user.accessCount, 0)
)

// Mock data for now - will be replaced with real API call
const getMockUsersData = () => {
  return {
    data: [
      {
        fullName: 'Ali Hassan',
        lastLogin: '2025-09-13T10:30:15.262992Z',
        accessCount: 12,
        id: 'ed8b56ee-6003-4393-a73b-b10d64f54f34',
      },
      {
        fullName: 'Sarah Johnson',
        lastLogin: '2025-09-13T09:15:42.123456Z',
        accessCount: 8,
        id: 'f2c9a1b4-7856-4d23-9e10-c4b8a7e6d2f5',
      },
      {
        fullName: 'Ahmed Mohamed',
        lastLogin: '2025-09-12T16:45:33.789012Z',
        accessCount: 23,
        id: '3a7b2c4d-5e6f-7890-abcd-ef1234567890',
      },
      {
        fullName: 'Maya Chen',
        lastLogin: '2025-09-12T14:22:18.345678Z',
        accessCount: 5,
        id: 'b9c8d7e6-f5a4-3b2c-1d0e-9f8e7d6c5b4a',
      },
      {
        fullName: 'John Smith',
        lastLogin: '2025-09-11T11:30:45.567890Z',
        accessCount: 15,
        id: 'c1d2e3f4-g5h6-i7j8-k9l0-m1n2o3p4q5r6',
      }
    ],
    pagesCount: 1,
    currentPage: 1,
    type: "UserDto",
    totalCount: 5
  }
}

const fetchUsersData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // TODO: Replace with real API call when backend is ready
    // const response = await fetch('http://10.21.54.237:8001/api/admin/users')
    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`)
    // }
    // const data = await response.json()
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Use mock data for now
    const data = getMockUsersData()
    
    users.value = data.data
    totalCount.value = data.totalCount
    pagesCount.value = data.pagesCount
    currentPage.value = data.currentPage
    
  } catch (err) {
    console.error('Failed to fetch users data:', err)
    error.value = 'Failed to load users data. Please try again.'
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  fetchUsersData()
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatId = (id) => {
  if (!id) return ''
  return id.substring(0, 8) + '...'
}

onMounted(() => {
  fetchUsersData()
})
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: 2rem 0;
  background-color: #f8fafc;
}

.container {
  margin: 2rem auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 95%;
  max-width: 1200px;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.dashboard-header h1 {
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 2.2rem;
}

.dashboard-header p {
  color: #718096;
  font-size: 1.1rem;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.table-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.table-header h3 {
  color: #2d3748;
  margin: 0;
  font-size: 1.4rem;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner,
.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state p {
  color: #e53e3e;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.5rem 1rem;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.users-table th {
  background: #f7fafc;
  color: #4a5568;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #2d3748;
}

.user-row:hover {
  background-color: #f8fafc;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.user-name {
  font-weight: 600;
}

.count-badge {
  background: #48bb78;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.last-login {
  color: #718096;
  font-size: 0.9rem;
}

.user-id {
  font-family: monospace;
  color: #718096;
  font-size: 0.85rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #718096;
}

.pagination-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
  text-align: center;
  color: #718096;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .container {
    width: 95%;
    padding: 1rem;
  }
  
  .dashboard-header h1 {
    font-size: 1.8rem;
  }
  
  .stats-summary {
    grid-template-columns: 1fr;
  }
  
  .table-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .refresh-btn {
    align-self: center;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }
  
  .name-cell {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .user-avatar {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.8rem;
  }
}
</style>