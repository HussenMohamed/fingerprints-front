<template>
  <div class="login-page">
    <Navigation />
    <div class="container">
      <header class="login-header">
        <h1>🔐 Fingerprint Login</h1>
        <p>Authenticate with your fingerprint to access the system</p>
      </header>

      <!-- System Type Selection -->
      <div class="system-selector">
        <h3>Select Attendance System:</h3>
        <div class="switch-container">
          <label class="switch">
            <input
              type="checkbox"
              v-model="isBankSystem"
              @change="updateSystemType"
            />
            <span class="slider">
              <!-- <span class="slider-text">{{
                isBankSystem ? "Bank" : "Gym"
              }}</span> -->
            </span>
          </label>
          <div class="system-info">
            <span class="system-icon">{{ isBankSystem ? "🏦" : "💪" }}</span>
            <span class="system-name">
              {{
                isBankSystem
                  ? "Bank Attendance System"
                  : "Gym Attendance System"
              }}
            </span>
          </div>
        </div>
      </div>

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
import { ref } from "vue";
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

// System type selection
const isBankSystem = ref(false); // false = Gym (0), true = Bank (1)
const systemType = ref(0); // 0 = Gym, 1 = Bank

const updateSystemType = () => {
  systemType.value = isBankSystem.value ? 1 : 0;
  console.log(
    "System type changed to:",
    systemType.value,
    isBankSystem.value ? "Bank" : "Gym"
  );
};

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

    if (result.matched) {
      // Store authentication state
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userInfo", JSON.stringify(result.user));
      localStorage.setItem("loginTime", new Date().toISOString());
      localStorage.setItem("loginProbability", result.probability.toString());

      // Show success message
      status.value = "success";
      statusTitle.value = "Login Successful";
      statusMessage.value = `Welcome ${
        result.user?.fullName || "User"
      }! Match: ${result.probability}%`;

      // Redirect to dashboard
      setTimeout(() => {
        // For now, show user info (later this will be router.push('/dashboard'))
        showUserDashboard(result.user, result.probability);
      }, 2000);
    } else {
      status.value = "error";
      statusTitle.value = "Fingerprint Not Recognized";
      statusMessage.value =
        "No matching fingerprint found. Please register or try again.";

      // Show register suggestion after a delay
      setTimeout(() => {
        status.value = "error";
        statusTitle.value = "Not Registered?";
        statusMessage.value =
          "If you haven't registered yet, please click 'Register here' below.";
      }, 3000);
    }
  } catch (error) {
    status.value = "error";
    statusTitle.value = "Login Error";
    statusMessage.value = "Authentication service error. Please try again.";
    console.error("Login error:", error);
  }
};

const showUserDashboard = (user, probability) => {
  // For now, show an alert with user info (later this will be a proper dashboard page)
  const dashboardInfo = `
🎉 Login Successful!

👤 User Information:
Name: ${user.fullName}
ID: ${user.id}
Attendance Count: ${user.attendanceCount}
Created: ${new Date(user.creationDate).toLocaleDateString()}

🔍 Match Details:
Confidence: ${probability}%
Login Time: ${new Date().toLocaleString()}
  `;

  alert(dashboardInfo);

  // TODO: Later replace with router.push('/dashboard')
  // router.push('/dashboard')
};

const authenticateWithFingerprint = async (base64Image) => {
  try {
    // Convert base64 to blob for multipart/form-data upload
    const byteCharacters = atob(base64Image);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/bmp" });

    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append("file", blob, "fingerprint.bmp");
    formData.append("systemType", systemType.value.toString());

    const response = await fetch(
      "http://10.21.54.237:8001/api/admin/fingerprint/verify",
      {
        method: "POST",
        body: formData, // No Content-Type header, let browser set it with boundary
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Transform backend response to match our expected format
    return {
      success: result.matched,
      matched: result.matched,
      probability: result.probability,
      user: result.user || null,
      message: result.matched
        ? `Fingerprint matched with ${result.probability}% confidence`
        : "Fingerprint not recognized. Please try again or register.",
    };
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

/* System Selector Styles */
.system-selector {
  margin-bottom: 2rem;
  text-align: center;
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.system-selector h3 {
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
}

.switch-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 80px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #667eea;
  border-radius: 34px;
  transition: all 0.4s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  border-radius: 50%;
  transition: 0.4s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: #48bb78;
}

input:checked + .slider:before {
  transform: translateX(46px);
}

.slider-text {
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-right: 10px;
}

.system-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.system-icon {
  font-size: 1.5rem;
}

.system-name {
  font-weight: 600;
  color: #2d3748;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .system-selector {
    padding: 1rem;
  }

  .system-info {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .system-icon {
    font-size: 1.2rem;
  }
}
</style>
