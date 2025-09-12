// Fingerprint Scanner Frontend Controller
class FingerprintScanner {
  constructor() {
    this.isScanning = false;
    this.pollInterval = null;
    this.captureCount = 0;
    this.currentImageBlob = null;

    this.initializeElements();
    this.setupEventListeners();
    this.startStatusPolling();
  }

  initializeElements() {
    // Status display elements
    this.statusCard = document.getElementById("status-display");
    this.statusIcon = document.getElementById("status-icon");
    this.statusTitle = document.getElementById("status-title");
    this.statusMessage = document.getElementById("status-message");

    // Button elements
    this.scanButton = document.getElementById("scan-button");
    this.cancelButton = document.getElementById("cancel-button");
    this.retakeButton = document.getElementById("retake-button");
    this.uploadButton = document.getElementById("upload-button");

    // Preview elements
    this.previewSection = document.getElementById("preview-section");
    this.fingerprintPreview = document.getElementById("fingerprint-preview");
    this.progressBar = document.getElementById("progress-bar");

    // Debug elements
    this.serviceStatus = document.getElementById("service-status");
    this.lastUpdate = document.getElementById("last-update");
    this.captureCountDisplay = document.getElementById("capture-count");
  }

  setupEventListeners() {
    this.scanButton.addEventListener("click", () => this.startScan());
    this.cancelButton.addEventListener("click", () => this.cancelScan());
    this.retakeButton.addEventListener("click", () => this.retakeScan());
    this.uploadButton.addEventListener("click", () => this.uploadFingerprint());

    // Handle page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.isScanning) {
        this.resumeStatusPolling();
      }
    });
  }

  async startScan() {
    if (this.isScanning) return;

    try {
      this.isScanning = true;
      this.updateUI("scanning");
      this.showProgress();

      // Create capture request flag
      await this.createCaptureRequest();

      // Start intensive polling during scan
      this.startScanPolling();
    } catch (error) {
      console.error("Failed to start scan:", error);
      this.updateUI("error", "Failed to start scan", error.message);
      this.isScanning = false;
    }
  }

  async createCaptureRequest() {
    // For file-based communication, we need to trigger the Python service
    // Since browsers can't directly create files, we'll use a different approach
    try {
      // Send request to a simple local server or use alternative method
      const response = await fetch("/api/trigger-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_scan" }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with scanner service");
      }
    } catch (error) {
      // Fallback: Show instructions for manual trigger
      this.showManualTriggerInstructions();
    }
  }

  showManualTriggerInstructions() {
    this.updateUI(
      "scanning",
      "Manual Trigger Required",
      "Please run this command in terminal: echo. > communication\\capture_request.flag"
    );

    // Continue polling for status updates
    this.startScanPolling();
  }

  startScanPolling() {
    // Poll status every 500ms during scanning
    this.pollInterval = setInterval(() => {
      this.checkScanStatus();
    }, 500);
  }

  resumeStatusPolling() {
    // Regular status polling every 2 seconds
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => {
        this.checkScanStatus();
      }, 2000);
    }
  }

  startStatusPolling() {
    // Initial status check
    this.checkScanStatus();

    // Regular polling every 2 seconds when not scanning
    if (!this.isScanning) {
      this.resumeStatusPolling();
    }
  }

  async checkScanStatus() {
    try {
      const status = await this.fetchServiceStatus();
      this.updateServiceStatus(status);

      if (this.isScanning) {
        this.handleScanStatus(status);
      }
    } catch (error) {
      console.error("Status check failed:", error);
      this.updateServiceStatus({
        status: "error",
        message: "Cannot connect to service",
        error: error.message,
      });
    }
  }

  async fetchServiceStatus() {
    // Try to read status.json via different methods
    try {
      // Method 1: Try to fetch via local server
      const response = await fetch("/api/status");
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Method 1 failed, try method 2
    }

    try {
      // Method 2: Try direct file access (limited browser support)
      const response = await fetch("../communication/status.json");
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Method 2 failed
    }

    // If all methods fail, show manual instructions
    throw new Error("Cannot access status file. Service may not be running.");
  }

  handleScanStatus(status) {
    switch (status.status) {
      case "capturing":
        this.updateUI("scanning", "Scanning...", status.message);
        break;

      case "success":
        this.handleScanSuccess(status);
        break;

      case "error":
        this.handleScanError(status);
        break;

      default:
        // Continue waiting
        break;
    }
  }

  async handleScanSuccess(status) {
    this.isScanning = false;
    this.captureCount++;
    this.updateCaptureCount();

    try {
      // Load the captured image
      await this.loadCapturedImage(status.image_path);
      this.updateUI(
        "success",
        "Scan Complete",
        "Fingerprint captured successfully!"
      );
      this.showPreview();
      this.hideProgress();
    } catch (error) {
      console.error("Failed to load captured image:", error);
      this.updateUI(
        "error",
        "Image Load Failed",
        "Could not load captured fingerprint"
      );
    }

    this.clearPollInterval();
  }

  handleScanError(status) {
    this.isScanning = false;
    this.updateUI(
      "error",
      "Scan Failed",
      status.message || "An error occurred during scanning"
    );
    this.hideProgress();
    this.clearPollInterval();

    // Auto-retry after timeout errors
    if (status.error === "timeout") {
      setTimeout(() => {
        this.updateUI(
          "ready",
          "Ready to Scan",
          "Place finger on sensor and try again"
        );
      }, 3000);
    }
  }

  async loadCapturedImage(imagePath) {
    try {
      // Try different methods to load the image
      let imageUrl;

      try {
        // Method 1: Via local server
        const response = await fetch("/api/image");
        if (response.ok) {
          const blob = await response.blob();
          imageUrl = URL.createObjectURL(blob);
          this.currentImageBlob = blob;
        }
      } catch (error) {
        // Method 1 failed, try method 2
        try {
          // Method 2: Direct file access
          imageUrl = "../communication/latest_capture.bmp?" + Date.now(); // Cache buster
        } catch (error) {
          throw new Error("Cannot load image file");
        }
      }

      // Set image source
      this.fingerprintPreview.src = imageUrl;
      this.fingerprintPreview.onload = () => {
        console.log("Image loaded successfully");
      };
    } catch (error) {
      throw new Error(`Failed to load image: ${error.message}`);
    }
  }

  cancelScan() {
    if (!this.isScanning) return;

    this.isScanning = false;
    this.updateUI("ready", "Scan Cancelled", 'Click "Start Scan" to try again');
    this.hideProgress();
    this.clearPollInterval();
  }

  retakeScan() {
    this.hidePreview();
    this.startScan();
  }

  async uploadFingerprint() {
    if (!this.currentImageBlob && !this.fingerprintPreview.src) {
      alert("No fingerprint to upload");
      return;
    }

    try {
      this.uploadButton.textContent = "Uploading...";
      this.uploadButton.disabled = true;

      // Convert image to base64 for upload
      const base64Image = await this.imageToBase64(this.fingerprintPreview);

      // Upload to backend (replace with your .NET backend URL)
      const uploadData = {
        fingerprint: base64Image,
        timestamp: new Date().toISOString(),
        captureId: `fp_${Date.now()}`,
      };

      const response = await fetch(
        "https://your-backend-api.com/api/fingerprints",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(uploadData),
        }
      );

      if (response.ok) {
        this.updateUI(
          "success",
          "Upload Complete",
          "Fingerprint sent to system successfully!"
        );
        setTimeout(() => {
          this.resetInterface();
        }, 2000);
      } else {
        throw new Error(`Upload failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      this.uploadButton.textContent = "Upload to System";
      this.uploadButton.disabled = false;
    }
  }

  async imageToBase64(imgElement) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    ctx.drawImage(imgElement, 0, 0);

    return canvas.toDataURL("image/bmp").split(",")[1]; // Remove data:image/bmp;base64, prefix
  }

  updateUI(state, title = "", message = "") {
    // Update status card appearance
    this.statusCard.className = `status-card ${state}`;

    // Update status icon
    const icons = {
      ready: "🔍",
      scanning: "⏳",
      success: "✅",
      error: "❌",
    };
    this.statusIcon.textContent = icons[state] || "🔍";

    // Update text content
    if (title) this.statusTitle.textContent = title;
    if (message) this.statusMessage.textContent = message;

    // Update button states
    this.updateButtonStates(state);
  }

  updateButtonStates(state) {
    switch (state) {
      case "ready":
        this.scanButton.disabled = false;
        this.scanButton.textContent = "👆 Start Scan";
        this.cancelButton.style.display = "none";
        break;

      case "scanning":
        this.scanButton.disabled = true;
        this.scanButton.textContent = "⏳ Scanning...";
        this.cancelButton.style.display = "inline-flex";
        break;

      case "success":
      case "error":
        this.scanButton.disabled = false;
        this.scanButton.textContent = "👆 Start Scan";
        this.cancelButton.style.display = "none";
        break;
    }
  }

  showProgress() {
    this.progressBar.style.display = "block";
    const fill = this.progressBar.querySelector(".progress-fill");
    fill.style.width = "100%";
  }

  hideProgress() {
    this.progressBar.style.display = "none";
    const fill = this.progressBar.querySelector(".progress-fill");
    fill.style.width = "0%";
  }

  showPreview() {
    this.previewSection.style.display = "block";
  }

  hidePreview() {
    this.previewSection.style.display = "none";
  }

  updateServiceStatus(status) {
    this.serviceStatus.textContent = status.status || "unknown";
    this.lastUpdate.textContent = new Date(
      status.timestamp || Date.now()
    ).toLocaleTimeString();

    // Update last update time
    if (status.timestamp) {
      this.lastUpdate.textContent = new Date(
        status.timestamp
      ).toLocaleTimeString();
    }
  }

  updateCaptureCount() {
    this.captureCountDisplay.textContent = this.captureCount;
  }

  clearPollInterval() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Resume regular polling after 3 seconds
    setTimeout(() => {
      if (!this.isScanning) {
        this.resumeStatusPolling();
      }
    }, 3000);
  }

  resetInterface() {
    this.hidePreview();
    this.updateUI(
      "ready",
      "Ready to Scan",
      'Click "Start Scan" to begin fingerprint capture'
    );
    this.currentImageBlob = null;
  }
}

// Initialize the scanner when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.fingerprintScanner = new FingerprintScanner();
  console.log("Fingerprint Scanner Interface initialized");
});
