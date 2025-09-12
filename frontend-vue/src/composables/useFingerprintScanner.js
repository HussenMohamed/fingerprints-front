import { ref, onMounted, onUnmounted } from 'vue'

const STATUS_ICONS = {
  ready: '🔍',
  scanning: '⏳',
  success: '✅',
  error: '❌'
}

const SCAN_TIMEOUT = 15000
const POLL_INTERVAL = 500

export function useFingerprintScanner() {
  const status = ref('ready')
  const statusTitle = ref('Ready to Scan')
  const statusMessage = ref('Click "Start Scan" to begin fingerprint capture')
  const statusIcon = ref('🔍')
  const isScanning = ref(false)
  const capturedImage = ref(null)
  const pollInterval = ref(null)
  const scanTimeout = ref(null)

  const updateStatus = (newStatus, title, message) => {
    status.value = newStatus
    statusTitle.value = title
    statusMessage.value = message
    statusIcon.value = STATUS_ICONS[newStatus] || '🔍'
  }

  const startPolling = () => {
    if (pollInterval.value) return
    
    pollInterval.value = setInterval(async () => {
      try {
        const statusData = await fetchScanStatus()
        if (statusData && isScanning.value) {
          handleScanStatus(statusData)
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, POLL_INTERVAL)
  }

  const stopPolling = () => {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
  }

  const startScanTimeout = () => {
    scanTimeout.value = setTimeout(() => {
      if (isScanning.value) {
        handleScanTimeout()
      }
    }, SCAN_TIMEOUT)
  }

  const stopScanTimeout = () => {
    if (scanTimeout.value) {
      clearTimeout(scanTimeout.value)
      scanTimeout.value = null
    }
  }

  const handleScanTimeout = () => {
    isScanning.value = false
    stopPolling()
    stopScanTimeout()
    updateStatus('error', 'Scan Timeout', 'No fingerprint detected. Please try again.')
  }

  const startScan = async () => {
    if (isScanning.value) return

    try {
      isScanning.value = true
      capturedImage.value = null
      updateStatus('scanning', 'Scanning...', 'Place your finger on the sensor')

      await triggerScan()
      startPolling()
      startScanTimeout()
    } catch (error) {
      console.error('Failed to start scan:', error)
      isScanning.value = false
      updateStatus('error', 'Scan Failed', 'Could not start fingerprint scan')
    }
  }

  const cancelScan = () => {
    if (!isScanning.value) return

    isScanning.value = false
    stopPolling()
    stopScanTimeout()
    updateStatus('ready', 'Scan Cancelled', 'Click "Start Scan" to try again')
  }

  const retakeScan = () => {
    capturedImage.value = null
    startScan()
  }

  const triggerScan = async () => {
    try {
      const response = await fetch('/api/trigger-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_scan' })
      })

      if (!response.ok) {
        throw new Error('Failed to trigger scan')
      }
    } catch (error) {
      updateStatus('scanning', 'Manual Trigger Required', 
        'Run: echo. > communication\\capture_request.flag')
      throw error
    }
  }

  const fetchScanStatus = async () => {
    try {
      const response = await fetch('/api/status')
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Status fetch error:', error)
    }
    return null
  }

  const handleScanStatus = (statusData) => {
    switch (statusData.status) {
      case 'capturing':
        updateStatus('scanning', 'Scanning...', 
          statusData.message || 'Processing fingerprint...')
        break
      
      case 'success':
        handleScanSuccess()
        break
      
      case 'error':
        handleScanError(statusData)
        break
    }
  }

  const handleScanSuccess = async () => {
    isScanning.value = false
    stopPolling()
    stopScanTimeout()

    try {
      const imageUrl = await loadCapturedImage()
      capturedImage.value = imageUrl
      updateStatus('success', 'Scan Complete', 'Fingerprint captured successfully!')
    } catch (error) {
      console.error('Failed to load image:', error)
      updateStatus('error', 'Image Load Failed', 'Could not load captured fingerprint')
    }
  }

  const handleScanError = (statusData) => {
    isScanning.value = false
    stopPolling()
    stopScanTimeout()
    updateStatus('error', 'Scan Failed', 
      statusData.message || 'An error occurred during scanning')
  }

  const loadCapturedImage = async () => {
    try {
      const response = await fetch('/api/image')
      if (response.ok) {
        const blob = await response.blob()
        return URL.createObjectURL(blob)
      }
      throw new Error('Could not load image')
    } catch (error) {
      throw new Error(`Failed to load image: ${error.message}`)
    }
  }

  onMounted(() => {
    updateStatus('ready', 'Ready to Scan', 'Click "Start Scan" to begin fingerprint capture')
  })

  onUnmounted(() => {
    stopPolling()
    stopScanTimeout()
  })

  return {
    status,
    statusTitle,
    statusMessage,
    statusIcon,
    isScanning,
    capturedImage,
    startScan,
    cancelScan,
    retakeScan
  }
}