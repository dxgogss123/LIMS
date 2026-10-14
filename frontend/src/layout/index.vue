<template>
  <div class="app-layout">
    <Header :collapsed="collapsed" @toggle="collapsed = !collapsed" />
    <div class="app-layout__body">
      <Sidebar :collapsed="collapsed" />
      <div class="app-layout__main">
        <TagsView />
        <AppMain />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Header from './components/Header.vue'
import Sidebar from './components/Sidebar.vue'
import TagsView from './components/TagsView.vue'
import AppMain from './components/AppMain.vue'

const collapsed = ref(false)
</script>

<style scoped>
.app-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.app-layout__body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.app-layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
}
</style>