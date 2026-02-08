<template>
  <div class="h-screen bg-white">
    <!-- Sidebar -->
    <Sidebar class="fixed inset-y-0 left-0" />

    <!-- Main Content -->
    <div class="ml-64 bg-gray-50 min-h-screen border-l border-blue-50">
      <div class="max-w-7xl mx-auto p-8">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '../components/Sidebar.vue'
</script>
