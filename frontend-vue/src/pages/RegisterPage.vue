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
          <div class="thumb-progress">
            <div class="current-thumb-info">
              <h4>
                {{ currentThumb === "right" ? "Right Thumb" : "Left Thumb" }}
              </h4>
              <span>Scan {{ currentThumbCompletedScans + 1 }} of 5</span>
            </div>
            <div class="overall-progress">
              <span
                >Overall Progress: {{ completedScans }} of
                {{ totalScans }} scans</span
              >
              <div class="progress-bar-container">
                <div
                  class="progress-bar-fill"
                  :style="{ width: progressPercentage + '%' }"
                ></div>
              </div>
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
            :button-text="getScanButtonText"
            @start-scan="startScan"
          />

          <CancelButton v-if="isScanning" @cancel-scan="cancelScan" />
        </div>

        <ProgressBar v-if="isScanning" />

        <PreviewSection
          v-if="capturedImage"
          :image-url="capturedImage"
          :action-text="'Confirm Scan'"
          @retake-scan="retakeScan"
          @confirm-action="confirmFingerprint"
        />

        <!-- Captured Scans Display -->
        <div class="captured-scans" v-if="completedScans > 0">
          <div class="thumb-section" v-if="rightThumbScans.length > 0">
            <h4>Right Thumb Scans ({{ rightThumbScans.length }}/5):</h4>
            <div class="scan-list">
              <div
                v-for="(scan, index) in rightThumbScans"
                :key="`right-${index}`"
                class="scan-item"
              >
                <img
                  :src="scan.imageUrl"
                  :alt="`Right Thumb Scan ${index + 1}`"
                />
                <span>Scan {{ index + 1 }}</span>
              </div>
            </div>
          </div>

          <div class="thumb-section" v-if="leftThumbScans.length > 0">
            <h4>Left Thumb Scans ({{ leftThumbScans.length }}/5):</h4>
            <div class="scan-list">
              <div
                v-for="(scan, index) in leftThumbScans"
                :key="`left-${index}`"
                class="scan-item"
              >
                <img
                  :src="scan.imageUrl"
                  :alt="`Left Thumb Scan ${index + 1}`"
                />
                <span>Scan {{ index + 1 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isAllScansComplete" class="complete-registration">
          <button @click="handleCompleteRegistration" class="btn btn-success">
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
            Your account has been created successfully with
            {{ completedScans }} fingerprint scans registered ({{
              rightThumbScans.length
            }}
            right thumb + {{ leftThumbScans.length }} left thumb).
          </p>

          <div class="user-summary">
            <h4>Account Details:</h4>
            <p><strong>Name:</strong> {{ userDetails.fullName }}</p>
            <p>
              <strong>Right Thumb Scans:</strong>
              {{ rightThumbScans.length }} registered
            </p>
            <p>
              <strong>Left Thumb Scans:</strong>
              {{ leftThumbScans.length }} registered
            </p>
            <p><strong>Total Scans:</strong> {{ completedScans }} registered</p>
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
import { useFingerprintScanner } from "../composables/useFingerprintScanner";
import { useRegistration } from "../composables/useRegistration";
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

const {
  currentStep,
  currentThumb,
  currentScanNumber,
  rightThumbScans,
  leftThumbScans,
  userDetails,
  isProcessing,
  totalScans,
  completedScans,
  currentThumbCompletedScans,
  isCurrentThumbComplete,
  isAllScansComplete,
  progressPercentage,
  getCurrentScanPrompt,
  getScanButtonText,
  goToStep,
  validateUserDetails,
  addFingerprint,
  completeRegistration,
  getOrdinalNumber,
} = useRegistration();

const startFingerprintCapture = () => {
  goToStep("fingerprints");
  status.value = "ready";
  statusTitle.value = getCurrentScanPrompt.value;
  statusMessage.value = `Click "${getScanButtonText.value}" to begin`;
};

const confirmFingerprint = async () => {
  if (!capturedImage.value || !capturedImageBase64.value) return;

  // Store the captured fingerprint scan
  const fingerprintData = {
    imageUrl: capturedImage.value,
    base64: capturedImageBase64.value,
    quality: "good", // Mock quality assessment
  };

  const result = await addFingerprint(fingerprintData);

  if (result.success) {
    // Reset for next scan
    capturedImage.value = null;

    if (isAllScansComplete.value) {
      status.value = "success";
      statusTitle.value = "All Scans Complete";
      statusMessage.value = 'Click "Complete Registration" to finish';
    } else {
      status.value = "ready";
      statusTitle.value = getCurrentScanPrompt.value;
      statusMessage.value = `Click "${getScanButtonText.value}" to continue`;
    }
  }
};

const handleCompleteRegistration = async () => {
  const result = await completeRegistration();

  if (result.success) {
    status.value = "success";
    statusTitle.value = "Registration Complete";
    statusMessage.value = "Your account has been created successfully!";
  } else {
    status.value = "error";
    statusTitle.value = "Registration Failed";
    statusMessage.value =
      result.error || "Failed to complete registration. Please try again.";
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

.thumb-progress {
  margin-top: 1rem;
  text-align: center;
}

.current-thumb-info h4 {
  color: #667eea;
  margin: 0;
  font-size: 1.2rem;
}

.current-thumb-info span {
  color: #718096;
  font-size: 0.9rem;
}

.overall-progress {
  margin-top: 1rem;
}

.overall-progress span {
  color: #4a5568;
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.5rem;
}

.progress-bar-container {
  background-color: #e2e8f0;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  background-color: #667eea;
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 3px;
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

.captured-scans {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #f7fafc;
  border-radius: 8px;
}

.thumb-section {
  margin-bottom: 1.5rem;
}

.thumb-section:last-child {
  margin-bottom: 0;
}

.thumb-section h4 {
  margin: 0 0 1rem 0;
  color: #2d3748;
  font-size: 1rem;
}

.scan-list {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.scan-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.scan-item img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid #48bb78;
}

.scan-item span {
  font-size: 0.75rem;
  color: #718096;
  text-align: center;
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
