<template>
  <div class="p-10 bg-red-100 text-red-900 border-2 border-red-500">
    <h1 class="text-4xl font-bold">DEBUG VIEW</h1>
    <p class="mt-4 text-xl">If you can see this, Vue Router and Vue are working!</p>
    <p>Time: {{ new Date().toLocaleTimeString() }}</p>
    <router-link to="/login" class="text-blue-600 underline mt-4 block">Go to Login</router-link>
  </div>
</template>

<script setup>
console.log("Debug view mounted");
</script>
