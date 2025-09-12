<template>
  <div class="preview-section">
    <h3>Captured Fingerprint</h3>
    <div class="image-container">
      <img 
        :src="imageUrl" 
        alt="Captured Fingerprint" 
        class="fingerprint-image"
      />
    </div>
    <button 
      class="btn btn-secondary" 
      @click="$emit('retakeScan')"
    >
      <span>🔄</span>
      Retake
    </button>
  </div>
</template>

<script setup>
defineProps({
  imageUrl: {
    type: String,
    required: true
  }
})

defineEmits(['retakeScan'])
</script>