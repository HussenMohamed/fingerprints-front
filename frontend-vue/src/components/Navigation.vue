<template>
  <nav class="navigation">
    <div class="nav-container">
      <div class="nav-brand">
        <h2>🔐 Fingerprint Auth</h2>
      </div>

      <div class="nav-links">
        <router-link
          to="/login"
          class="nav-link"
          :class="{ active: $route.path === '/login' }"
        >
          <span class="nav-icon">🔑</span>
          Login
        </router-link>

        <router-link
          to="/register"
          class="nav-link"
          :class="{ active: $route.path === '/register' }"
        >
          <span class="nav-icon">📝</span>
          Register
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isAuthenticated = ref(false);

const checkAuthStatus = () => {
  isAuthenticated.value = localStorage.getItem("isAuthenticated") === "true";
};

const handleLogout = async () => {
  try {
    // Call logout API
    await fetch("http://localhost:8080/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    // Clear local storage regardless of API result
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("loginTime");

    isAuthenticated.value = false;
    router.push("/login");
  }
};

onMounted(() => {
  checkAuthStatus();

  // Listen for authentication state changes
  window.addEventListener("storage", checkAuthStatus);
});
</script>

<style scoped>
.navigation {
  background-color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  top: 0;
  z-index: 100;
  color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.nav-brand h2 {
  color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 10px;
  font-size: 1.5rem;
  font-weight: 700;
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  text-decoration: none;
  color: #667eea;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.95rem;
  border: 2px solid #667eea;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.nav-link.active {
  background: white;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.nav-link.active .nav-icon {
  filter: none;
}

.logout-btn {
  background: rgba(220, 53, 69, 0.2);
  border: 2px solid rgba(220, 53, 69, 0.3);
  cursor: pointer;
}

.logout-btn:hover {
  background: rgba(220, 53, 69, 0.3);
  border-color: rgba(220, 53, 69, 0.5);
}

.nav-icon {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 1rem;
    flex-direction: column;
    gap: 1rem;
  }

  .nav-brand h2 {
    font-size: 1.3rem;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }

  .nav-link {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
}
</style>
