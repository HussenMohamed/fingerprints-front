import { ref, computed } from "vue";

export function useRegistration() {
  const currentStep = ref("details"); // 'details', 'fingerprints', 'complete'
  const currentThumb = ref("right"); // 'right', 'left'
  const currentScanIndex = ref(0); // 0-4 for each thumb
  const rightThumbScans = ref([]);
  const leftThumbScans = ref([]);
  const userDetails = ref({
    fullName: "",
    email: "",
    department: "",
  });
  const isProcessing = ref(false);
  const errors = ref({});

  const SCANS_PER_THUMB = 5;

  // Computed properties
  const totalScans = computed(() => SCANS_PER_THUMB * 2); // 5 scans × 2 thumbs = 10 total
  const completedScans = computed(
    () => rightThumbScans.value.length + leftThumbScans.value.length
  );
  const currentThumbCompletedScans = computed(() =>
    currentThumb.value === "right"
      ? rightThumbScans.value.length
      : leftThumbScans.value.length
  );
  const isCurrentThumbComplete = computed(
    () => currentThumbCompletedScans.value >= SCANS_PER_THUMB
  );
  const isAllScansComplete = computed(
    () =>
      rightThumbScans.value.length >= SCANS_PER_THUMB &&
      leftThumbScans.value.length >= SCANS_PER_THUMB
  );
  const currentScanNumber = computed(() => currentScanIndex.value + 1);
  const progressPercentage = computed(() =>
    Math.round((completedScans.value / totalScans.value) * 100)
  );

  // Step management
  const goToStep = (step) => {
    currentStep.value = step;
  };

  const nextStep = () => {
    if (currentStep.value === "details") {
      if (validateUserDetails()) {
        currentStep.value = "fingerprints";
      }
    } else if (
      currentStep.value === "fingerprints" &&
      isAllScansComplete.value
    ) {
      currentStep.value = "complete";
    }
  };

  const previousStep = () => {
    if (currentStep.value === "fingerprints") {
      currentStep.value = "details";
    }
  };

  // User details validation
  const validateUserDetails = () => {
    errors.value = {};
    let isValid = true;

    if (!userDetails.value.fullName.trim()) {
      errors.value.fullName = "Full name is required";
      isValid = false;
    }

    if (!userDetails.value.email.trim()) {
      errors.value.email = "Email is required";
      isValid = false;
    } else if (!isValidEmail(userDetails.value.email)) {
      errors.value.email = "Please enter a valid email address";
      isValid = false;
    }

    return isValid;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Fingerprint management
  const addFingerprint = async (fingerprintData) => {
    try {
      isProcessing.value = true;

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newScan = {
        scanIndex: currentScanIndex.value,
        thumb: currentThumb.value,
        imageUrl: fingerprintData.imageUrl,
        base64: fingerprintData.base64,
        timestamp: new Date().toISOString(),
        quality: fingerprintData.quality || "good",
      };

      // Add to appropriate thumb array
      if (currentThumb.value === "right") {
        rightThumbScans.value.push(newScan);
      } else {
        leftThumbScans.value.push(newScan);
      }

      // Move to next scan or switch thumb
      if (currentThumbCompletedScans.value >= SCANS_PER_THUMB) {
        // Current thumb is complete
        if (
          currentThumb.value === "right" &&
          leftThumbScans.value.length < SCANS_PER_THUMB
        ) {
          // Switch to left thumb
          currentThumb.value = "left";
          currentScanIndex.value = 0;
        }
      } else {
        // Continue with current thumb
        currentScanIndex.value++;
      }

      return { success: true, scan: newScan };
    } catch (error) {
      console.error("Error adding fingerprint scan:", error);
      return { success: false, error: error.message };
    } finally {
      isProcessing.value = false;
    }
  };

  const removeLastScan = () => {
    if (currentThumb.value === "right" && rightThumbScans.value.length > 0) {
      rightThumbScans.value.pop();
      currentScanIndex.value = rightThumbScans.value.length;
    } else if (
      currentThumb.value === "left" &&
      leftThumbScans.value.length > 0
    ) {
      leftThumbScans.value.pop();
      currentScanIndex.value = leftThumbScans.value.length;
    }
  };

  const retakeCurrentScan = () => {
    removeLastScan();
  };

  // Registration completion
  const completeRegistration = async () => {
    try {
      isProcessing.value = true;

      if (!isAllScansComplete.value) {
        throw new Error(
          `Please complete all ${SCANS_PER_THUMB} scans for both thumbs`
        );
      }

      // Send to backend
      const result = await submitRegistration();

      if (result.success) {
        currentStep.value = "complete";
        return { success: true, user: result.user };
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration completion error:", error);
      return { success: false, error: error.message };
    } finally {
      isProcessing.value = false;
    }
  };

  const submitRegistration = async () => {
    try {
      // Create FormData for multipart/form-data
      const formData = new FormData();

      // Add each right thumb fingerprint as separate form fields
      rightThumbScans.value.forEach((scan, index) => {
        // Convert base64 to blob
        const base64Data = scan.base64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/bmp" });

        // Add as separate form field (same field name for each file)
        formData.append(
          "RightThumbFingerPrints",
          blob,
          `right_thumb_${index + 1}.bmp`
        );
      });

      // Add each left thumb fingerprint as separate form fields
      leftThumbScans.value.forEach((scan, index) => {
        // Convert base64 to blob
        const base64Data = scan.base64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/bmp" });

        // Add as separate form field (same field name for each file)
        formData.append(
          "LeftThumbFingerPrints",
          blob,
          `left_thumb_${index + 1}.bmp`
        );
      });

      // Prepare URL with fullName as query parameter
      const url = new URL("http://10.21.54.237:8001/api/admin/auth/register");
      url.searchParams.append("fullName", userDetails.value.fullName);

      const response = await fetch(url, {
        method: "POST",
        body: formData, // Note: Don't set Content-Type header, let browser set it with boundary
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

  // Reset/restart registration
  const resetRegistration = () => {
    currentStep.value = "details";
    currentThumb.value = "right";
    currentScanIndex.value = 0;
    rightThumbScans.value = [];
    leftThumbScans.value = [];
    userDetails.value = {
      fullName: "",
      email: "",
      department: "",
    };
    errors.value = {};
    isProcessing.value = false;
  };

  // Get ordinal number for display
  const getOrdinalNumber = (num) => {
    const ordinals = ["First", "Second", "Third", "Fourth", "Fifth"];
    return ordinals[num - 1] || `${num}th`;
  };

  // Get current scan prompt
  const getCurrentScanPrompt = computed(() => {
    const ordinal = getOrdinalNumber(currentScanNumber.value);
    const thumbName =
      currentThumb.value === "right" ? "Right Thumb" : "Left Thumb";
    return `Ready for ${ordinal} ${thumbName} Scan`;
  });

  const getScanButtonText = computed(() => {
    const ordinal = getOrdinalNumber(currentScanNumber.value);
    const thumbName =
      currentThumb.value === "right" ? "Right Thumb" : "Left Thumb";
    return `Scan ${ordinal} ${thumbName}`;
  });

  return {
    // State
    currentStep: computed(() => currentStep.value),
    currentThumb: computed(() => currentThumb.value),
    currentScanIndex: computed(() => currentScanIndex.value),
    currentScanNumber,
    rightThumbScans: computed(() => rightThumbScans.value),
    leftThumbScans: computed(() => leftThumbScans.value),
    userDetails,
    isProcessing: computed(() => isProcessing.value),
    errors: computed(() => errors.value),

    // Computed
    totalScans,
    completedScans,
    currentThumbCompletedScans,
    isCurrentThumbComplete,
    isAllScansComplete,
    progressPercentage,
    getCurrentScanPrompt,
    getScanButtonText,

    // Methods
    goToStep,
    nextStep,
    previousStep,
    validateUserDetails,
    addFingerprint,
    removeLastScan,
    retakeCurrentScan,
    completeRegistration,
    resetRegistration,
    getOrdinalNumber,
  };
}
