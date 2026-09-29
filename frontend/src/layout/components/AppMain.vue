<template>
  <main class="app-main">
    <router-view />
  </main>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-main {
  flex: 1;
  min-height: 0;
  margin: 8px;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  overflow: auto;
}
</style>