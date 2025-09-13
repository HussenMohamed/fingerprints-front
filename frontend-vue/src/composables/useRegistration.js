import { ref, computed } from 'vue'

export function useRegistration() {
  const currentStep = ref('details') // 'details', 'fingerprints', 'complete'
  const currentFingerprintIndex = ref(0)
  const capturedFingerprints = ref([])
  const userDetails = ref({
    fullName: '',
    email: '',
    department: ''
  })
  const isProcessing = ref(false)
  const errors = ref({})
  
  const REQUIRED_FINGERPRINTS = 3
  
  // Computed properties
  const totalFingerprints = computed(() => REQUIRED_FINGERPRINTS)
  const completedFingerprints = computed(() => capturedFingerprints.value.length)
  const isAllFingerprintsCollected = computed(() => 
    capturedFingerprints.value.length >= REQUIRED_FINGERPRINTS
  )
  const currentFingerprintNumber = computed(() => currentFingerprintIndex.value + 1)
  const progressPercentage = computed(() => 
    Math.round((completedFingerprints.value / REQUIRED_FINGERPRINTS) * 100)
  )
  
  // Step management
  const goToStep = (step) => {
    currentStep.value = step
  }
  
  const nextStep = () => {
    if (currentStep.value === 'details') {
      if (validateUserDetails()) {
        currentStep.value = 'fingerprints'
      }
    } else if (currentStep.value === 'fingerprints' && isAllFingerprintsCollected.value) {
      currentStep.value = 'complete'
    }
  }
  
  const previousStep = () => {
    if (currentStep.value === 'fingerprints') {
      currentStep.value = 'details'
    }
  }
  
  // User details validation
  const validateUserDetails = () => {
    errors.value = {}
    let isValid = true
    
    if (!userDetails.value.fullName.trim()) {
      errors.value.fullName = 'Full name is required'
      isValid = false
    }
    
    if (!userDetails.value.email.trim()) {
      errors.value.email = 'Email is required'
      isValid = false
    } else if (!isValidEmail(userDetails.value.email)) {
      errors.value.email = 'Please enter a valid email address'
      isValid = false
    }
    
    return isValid
  }
  
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  // Fingerprint management
  const addFingerprint = async (fingerprintData) => {
    try {
      isProcessing.value = true
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const newFingerprint = {
        index: currentFingerprintIndex.value,
        imageUrl: fingerprintData.imageUrl,
        timestamp: new Date().toISOString(),
        quality: fingerprintData.quality || 'good' // Mock quality assessment
      }
      
      capturedFingerprints.value.push(newFingerprint)
      
      // Move to next fingerprint if not all collected
      if (capturedFingerprints.value.length < REQUIRED_FINGERPRINTS) {
        currentFingerprintIndex.value++
      }
      
      return { success: true, fingerprint: newFingerprint }
    } catch (error) {
      console.error('Error adding fingerprint:', error)
      return { success: false, error: error.message }
    } finally {
      isProcessing.value = false
    }
  }
  
  const removeFingerprint = (index) => {
    const fingerprintIndex = capturedFingerprints.value.findIndex(fp => fp.index === index)
    if (fingerprintIndex !== -1) {
      capturedFingerprints.value.splice(fingerprintIndex, 1)
      
      // Adjust current fingerprint index if needed
      if (capturedFingerprints.value.length < REQUIRED_FINGERPRINTS) {
        currentFingerprintIndex.value = capturedFingerprints.value.length
      }
    }
  }
  
  const retakeFingerprint = (index) => {
    removeFingerprint(index)
    currentFingerprintIndex.value = index
  }
  
  // Registration completion
  const completeRegistration = async () => {
    try {
      isProcessing.value = true
      
      if (!validateUserDetails()) {
        throw new Error('Please fill in all required fields correctly')
      }
      
      if (!isAllFingerprintsCollected.value) {
        throw new Error(`Please capture all ${REQUIRED_FINGERPRINTS} fingerprints`)
      }
      
      const registrationData = {
        userDetails: userDetails.value,
        fingerprints: capturedFingerprints.value.map(fp => ({
          index: fp.index,
          timestamp: fp.timestamp,
          quality: fp.quality,
          // In a real app, you'd send the actual fingerprint data
          fingerprintData: `fingerprint_${fp.index}_data`
        }))
      }
      
      // Send to backend (mocked for now)
      const result = await submitRegistration(registrationData)
      
      if (result.success) {
        currentStep.value = 'complete'
        return { success: true, user: result.user }
      } else {
        throw new Error(result.message || 'Registration failed')
      }
      
    } catch (error) {
      console.error('Registration completion error:', error)
      return { success: false, error: error.message }
    } finally {
      isProcessing.value = false
    }
  }
  
  const submitRegistration = async (registrationData) => {
    try {
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
      return result
    } catch (error) {
      console.error('Registration API error:', error)
      throw error
    }
  }
  
  // Reset/restart registration
  const resetRegistration = () => {
    currentStep.value = 'details'
    currentFingerprintIndex.value = 0
    capturedFingerprints.value = []
    userDetails.value = {
      fullName: '',
      email: '',
      department: ''
    }
    errors.value = {}
    isProcessing.value = false
  }
  
  // Get ordinal number for display
  const getOrdinalNumber = (num) => {
    const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth']
    return ordinals[num - 1] || `${num}th`
  }
  
  // Get current fingerprint prompt
  const getCurrentFingerprintPrompt = computed(() => {
    const ordinal = getOrdinalNumber(currentFingerprintNumber.value)
    return `Ready for ${ordinal} Fingerprint`
  })
  
  const getScanButtonText = computed(() => {
    const ordinal = getOrdinalNumber(currentFingerprintNumber.value)
    return `Scan ${ordinal} Fingerprint`
  })
  
  return {
    // State
    currentStep: computed(() => currentStep.value),
    currentFingerprintIndex: computed(() => currentFingerprintIndex.value),
    currentFingerprintNumber,
    capturedFingerprints: computed(() => capturedFingerprints.value),
    userDetails,
    isProcessing: computed(() => isProcessing.value),
    errors: computed(() => errors.value),
    
    // Computed
    totalFingerprints,
    completedFingerprints,
    isAllFingerprintsCollected,
    progressPercentage,
    getCurrentFingerprintPrompt,
    getScanButtonText,
    
    // Methods
    goToStep,
    nextStep,
    previousStep,
    validateUserDetails,
    addFingerprint,
    removeFingerprint,
    retakeFingerprint,
    completeRegistration,
    resetRegistration,
    getOrdinalNumber
  }
}