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
    <div class="preview-actions">
      <button 
        class="btn btn-secondary" 
        @click="$emit('retakeScan')"
      >
        <span>🔄</span>
        Retake
      </button>
      <button 
        v-if="actionText"
        class="btn btn-primary" 
        @click="$emit('confirmAction')"
      >
        <span>✓</span>
        {{ actionText }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  actionText: {
    type: String,
    default: 'Upload to System'
  }
})

defineEmits(['retakeScan', 'confirmAction'])
</script>