<template>
  <div class="login-page">
    <Navigation />
    <div class="container">
      <header class="login-header">
        <h1>🔐 Fingerprint Login</h1>
        <p>Authenticate with your fingerprint to access the system</p>
      </header>

      <StatusCard
        :status="status"
        :icon="statusIcon"
        :title="statusTitle"
        :message="statusMessage"
      />

      <div class="button-group">
        <ScanButton
          :is-scanning="isScanning"
          :button-text="isScanning ? 'Scanning...' : 'Login with Fingerprint'"
          @start-scan="startScan"
        />

        <CancelButton v-if="isScanning" @cancel-scan="cancelScan" />
      </div>

      <ProgressBar v-if="isScanning" />

      <PreviewSection
        v-if="capturedImage"
        :image-url="capturedImage"
        :action-text="'Login'"
        @retake-scan="retakeScan"
        @confirm-action="handleLogin"
      />

      <div class="auth-links">
        <p>
          Don't have an account?
          <router-link to="/register" class="link">Register here</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFingerprintScanner } from "../composables/useFingerprintScanner";
import Navigation from "../components/Navigation.vue";
import StatusCard from "../components/StatusCard.vue";
import ScanButton from "../components/ScanButton.vue";
import CancelButton from "../components/CancelButton.vue";
import ProgressBar from "../components/ProgressBar.vue";
import PreviewSection from "../components/PreviewSection.vue";

const {
  status,
  statusTitle,
  statusMessage,
  statusIcon,
  isScanning,
  capturedImage,
  capturedImageBase64,
  startScan,
  cancelScan,
  retakeScan,
} = useFingerprintScanner();

const handleLogin = async () => {
  console.log("Captured Image Base64:", capturedImageBase64.value);
  try {
    // Check if we have captured fingerprint data
    if (!capturedImageBase64.value) {
      status.value = "error";
      statusTitle.value = "No Fingerprint";
      statusMessage.value = "Please capture a fingerprint first.";
      return;
    }

    // Send fingerprint for authentication
    const result = await authenticateWithFingerprint(capturedImageBase64.value);

    if (result.success) {
      // Store authentication state
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userToken", result.token || "demo-token");
      localStorage.setItem("userInfo", JSON.stringify(result.user || { name: "User" }));
      localStorage.setItem("loginTime", new Date().toISOString());

      // Show success message
      status.value = "success";
      statusTitle.value = "Login Successful";
      statusMessage.value = `Welcome back! Redirecting to dashboard...`;

      // In a real app, redirect to dashboard
      setTimeout(() => {
        alert("Login successful! Dashboard would open here.");
        // router.push('/dashboard')
      }, 2000);
    } else {
      status.value = "error";
      statusTitle.value = "Login Failed";
      statusMessage.value =
        result.message || "Fingerprint not recognized. Please try again.";
    }
  } catch (error) {
    status.value = "error";
    statusTitle.value = "Login Error";
    statusMessage.value = "Authentication service error. Please try again.";
    console.error("Login error:", error);
  }
};

const authenticateWithFingerprint = async (base64Image) => {
  try {
    const response = await fetch(
      "http://10.21.54.237:8001/api/admin/fingerprint/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: base64Image,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Authentication API error:", error);
    throw error;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.container {
  margin-top: 2rem;

  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 90%;
  max-width: 500px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.login-header p {
  color: #718096;
  font-size: 1rem;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
}

.auth-links {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.auth-links p {
  color: #718096;
  margin: 0;
}

.link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}
</style>
