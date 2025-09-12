<template>
  <button 
    class="btn" 
    :disabled="isScanning"
    @click="$emit('startScan')"
  >
    <span>{{ isScanning ? '⏳' : '👆' }}</span>
    {{ isScanning ? 'Scanning...' : 'Start Scan' }}
  </button>
</template>

<script setup>
defineProps({
  isScanning: {
    type: Boolean,
    required: true
  }
})

defineEmits(['startScan'])
</script>