<template>
  <button 
    class="btn btn-secondary" 
    @click="$emit('cancelScan')"
  >
    Cancel
  </button>
</template>

<script setup>
defineEmits(['cancelScan'])
</script>