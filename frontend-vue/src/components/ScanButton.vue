<template>
  <button 
    class="btn btn-primary" 
    :disabled="isScanning"
    @click="$emit('startScan')"
  >
    <span>{{ isScanning ? '⏳' : '👆' }}</span>
    {{ buttonText || (isScanning ? 'Scanning...' : 'Start Scan') }}
  </button>
</template>

<script setup>
defineProps({
  isScanning: {
    type: Boolean,
    required: true
  },
  buttonText: {
    type: String,
    default: ''
  }
})

defineEmits(['startScan'])
</script>