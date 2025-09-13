<template>
  <div class="register-page">
    <Navigation />
    <div class="container">
      <header class="register-header">
        <h1>🆕 Register New User</h1>
        <p>Create your account with secure fingerprint authentication</p>
      </header>

      <!-- User Details Form -->
      <div v-if="currentStep === 'details'" class="user-details-step">
        <h3>Step 1: Personal Information</h3>
        <form @submit.prevent="startFingerprintCapture" class="user-form">
          <div class="form-group">
            <label for="fullName">Full Name:</label>
            <input
              id="fullName"
              v-model="userDetails.fullName"
              type="text"
              required
              placeholder="Enter your full name"
            />
          </div>

          <button type="submit" class="btn btn-primary">
            Continue to Fingerprint Setup
          </button>
        </form>
      </div>

      <!-- Fingerprint Capture Steps -->
      <div v-else-if="currentStep === 'fingerprints'" class="fingerprint-step">
        <div class="progress-header">
          <h3>Step 2: Fingerprint Registration</h3>
          <div class="fingerprint-progress">
            <span>Fingerprint {{ currentFingerprintIndex + 1 }} of 3</span>
            <div class="progress-dots">
              <div
                v-for="i in 3"
                :key="i"
                class="dot"
                :class="{
                  completed: i <= capturedFingerprints.length,
                  active: i === currentFingerprintIndex + 1,
                }"
              ></div>
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
            :button-text="getScanButtonText()"
            @start-scan="startScan"
          />

          <CancelButton v-if="isScanning" @cancel-scan="cancelScan" />
        </div>

        <ProgressBar v-if="isScanning" />

        <PreviewSection
          v-if="capturedImage"
          :image-url="capturedImage"
          :action-text="'Confirm Fingerprint'"
          @retake-scan="retakeScan"
          @confirm-action="confirmFingerprint"
        />

        <!-- Captured Fingerprints Display -->
        <div
          v-if="capturedFingerprints.length > 0"
          class="captured-fingerprints"
        >
          <h4>Captured Fingerprints:</h4>
          <div class="fingerprint-list">
            <div
              v-for="(fp, index) in capturedFingerprints"
              :key="index"
              class="fingerprint-item"
            >
              <img :src="fp.imageUrl" :alt="`Fingerprint ${index + 1}`" />
              <span>Fingerprint {{ index + 1 }}</span>
            </div>
          </div>
        </div>

        <div
          v-if="capturedFingerprints.length === 3"
          class="complete-registration"
        >
          <button @click="completeRegistration" class="btn btn-success">
            Complete Registration
          </button>
        </div>
      </div>

      <!-- Registration Complete -->
      <div v-else-if="currentStep === 'complete'" class="completion-step">
        <div class="success-message">
          <div class="success-icon">✅</div>
          <h3>Registration Complete!</h3>
          <p>
            Your account has been created successfully with 3 fingerprints
            registered.
          </p>

          <div class="user-summary">
            <h4>Account Details:</h4>
            <p><strong>Name:</strong> {{ userDetails.fullName }}</p>
            <p><strong>Fingerprints:</strong> 3 registered</p>
          </div>

          <router-link to="/login" class="btn btn-primary">
            Go to Login
          </router-link>
        </div>
      </div>

      <div class="auth-links">
        <p>
          Already have an account?
          <router-link to="/login" class="link">Login here</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useFingerprintScanner } from "../composables/useFingerprintScanner";
import Navigation from "../components/Navigation.vue";
import StatusCard from "../components/StatusCard.vue";
import ScanButton from "../components/ScanButton.vue";
import CancelButton from "../components/CancelButton.vue";
import ProgressBar from "../components/ProgressBar.vue";
import PreviewSection from "../components/PreviewSection.vue";

const currentStep = ref("details"); // 'details', 'fingerprints', 'complete'
const currentFingerprintIndex = ref(0);
const capturedFingerprints = ref([]);

const userDetails = ref({
  fullName: "",
  email: "",
  department: "",
});

const {
  status,
  statusTitle,
  statusMessage,
  statusIcon,
  isScanning,
  capturedImage,
  startScan,
  cancelScan,
  retakeScan,
} = useFingerprintScanner();

const getScanButtonText = () => {
  if (isScanning.value) return "Scanning...";
  if (currentFingerprintIndex.value === 0) return "Scan First Fingerprint";
  if (currentFingerprintIndex.value === 1) return "Scan Second Fingerprint";
  if (currentFingerprintIndex.value === 2) return "Scan Third Fingerprint";
  return "Scan Fingerprint";
};

const startFingerprintCapture = () => {
  currentStep.value = "fingerprints";
  status.value = "ready";
  statusTitle.value = "Ready for First Fingerprint";
  statusMessage.value = 'Click "Scan First Fingerprint" to begin';
};

const confirmFingerprint = async () => {
  if (!capturedImage.value) return;

  // Store the captured fingerprint
  const fingerprintData = {
    index: currentFingerprintIndex.value,
    imageUrl: capturedImage.value,
    timestamp: new Date().toISOString(),
  };

  capturedFingerprints.value.push(fingerprintData);

  // Mock upload to backend
  await mockUploadFingerprint(fingerprintData);

  // Move to next fingerprint or complete
  if (capturedFingerprints.value.length < 3) {
    currentFingerprintIndex.value++;
    // Reset for next scan
    capturedImage.value = null;
    status.value = "ready";
    statusTitle.value = `Ready for ${getOrdinalNumber(
      currentFingerprintIndex.value + 1
    )} Fingerprint`;
    statusMessage.value = `Click "Scan ${getOrdinalNumber(
      currentFingerprintIndex.value + 1
    )} Fingerprint" to continue`;
  } else {
    status.value = "success";
    statusTitle.value = "All Fingerprints Captured";
    statusMessage.value = 'Click "Complete Registration" to finish';
  }
};

const getOrdinalNumber = (num) => {
  const ordinals = ["First", "Second", "Third"];
  return ordinals[num - 1] || `${num}th`;
};

const completeRegistration = async () => {
  try {
    // Send registration data to backend
    const result = await submitRegistration({
      userDetails: userDetails.value,
      fingerprints: capturedFingerprints.value,
    });

    if (result.success) {
      currentStep.value = "complete";

      // Also store in localStorage for demo purposes
      const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
      users.push(result.user);
      localStorage.setItem("registeredUsers", JSON.stringify(users));
    } else {
      status.value = "error";
      statusTitle.value = "Registration Failed";
      statusMessage.value =
        result.message || "Failed to complete registration. Please try again.";
    }
  } catch (error) {
    status.value = "error";
    statusTitle.value = "Registration Failed";
    statusMessage.value = "Failed to complete registration. Please try again.";
    console.error("Registration error:", error);
  }
};

const mockUploadFingerprint = async (fingerprintData) => {
  // Simulate individual fingerprint processing delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  console.log(
    `Fingerprint ${fingerprintData.index + 1} processed successfully`
  );
};

const submitRegistration = async (registrationData) => {
  try {
    const response = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Registration API error:", error);
    throw error;
  }
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 2rem 0;
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-header h1 {
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.register-header p {
  color: #718096;
  font-size: 1rem;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.form-group input {
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.progress-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.fingerprint-progress {
  margin-top: 1rem;
}

.progress-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #e2e8f0;
  transition: background-color 0.3s;
}

.dot.active {
  background-color: #667eea;
}

.dot.completed {
  background-color: #48bb78;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5a67d8;
}

.btn-success {
  background-color: #48bb78;
  color: white;
}

.btn-success:hover {
  background-color: #38a169;
}

.captured-fingerprints {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #f7fafc;
  border-radius: 8px;
}

.captured-fingerprints h4 {
  margin: 0 0 1rem 0;
  color: #2d3748;
}

.fingerprint-list {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.fingerprint-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.fingerprint-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #48bb78;
}

.fingerprint-item span {
  font-size: 0.875rem;
  color: #718096;
}

.complete-registration {
  text-align: center;
  margin: 1.5rem 0;
}

.completion-step {
  text-align: center;
}

.success-message {
  padding: 2rem 0;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.user-summary {
  background-color: #f7fafc;
  border-radius: 8px;
  padding: 1rem;
  margin: 1.5rem 0;
  text-align: left;
}

.user-summary h4 {
  margin: 0 0 1rem 0;
  color: #2d3748;
}

.user-summary p {
  margin: 0.5rem 0;
  color: #4a5568;
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
