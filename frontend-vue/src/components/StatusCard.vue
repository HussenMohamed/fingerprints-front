<template>
  <div class="status-card" :class="status">
    <div class="status-icon">{{ icon }}</div>
    <h2 class="status-title">{{ title }}</h2>
    <p class="status-message">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  status: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
})
</script>