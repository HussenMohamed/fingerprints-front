<template>
  <div class="container">
    <h1>🔐 Fingerprint Scanner</h1>
    
    <StatusCard 
      :status="status"
      :icon="statusIcon"
      :title="statusTitle"
      :message="statusMessage"
    />

    <div class="button-group">
      <ScanButton 
        :is-scanning="isScanning"
        @start-scan="startScan"
      />
      
      <CancelButton 
        v-if="isScanning"
        @cancel-scan="cancelScan"
      />
    </div>

    <ProgressBar v-if="isScanning" />

    <PreviewSection 
      v-if="capturedImage"
      :image-url="capturedImage"
      @retake-scan="retakeScan"
    />
  </div>
</template>

<script setup>
import { useFingerprintScanner } from './composables/useFingerprintScanner'
import StatusCard from './components/StatusCard.vue'
import ScanButton from './components/ScanButton.vue'
import CancelButton from './components/CancelButton.vue'
import ProgressBar from './components/ProgressBar.vue'
import PreviewSection from './components/PreviewSection.vue'

const {
  status,
  statusTitle,
  statusMessage,
  statusIcon,
  isScanning,
  capturedImage,
  startScan,
  cancelScan,
  retakeScan
} = useFingerprintScanner()
</script>