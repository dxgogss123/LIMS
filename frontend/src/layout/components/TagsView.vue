<template>
  <div class="tags-view">
    <div class="tags-view__scroll">
      <span
        v-for="tag in visitedViews"
        :key="tag.path"
        class="tags-view__item"
        :class="{ 'is-active': isActive(tag) }"
        @click="handleClick(tag)"
      >
        <span class="tags-view__dot" />
        <span class="tags-view__title">{{ tag.title }}</span>
        <el-icon v-if="!tag.affix" class="tags-view__close" @click.stop="handleClose(tag)">
          <Close />
        </el-icon>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { useTagsViewStore } from '@/stores/modules/tagsView'
import type { TagView } from '@/stores/modules/tagsView'

const route = useRoute()
const router = useRouter()
const store = useTagsViewStore()

const visitedViews = computed(() => store.visitedViews)

function isActive(tag: TagView): boolean {
  return tag.path === route.path
}

function handleClick(tag: TagView) {
  if (tag.path !== route.path) {
    router.push(tag.fullPath)
  }
}

function handleClose(tag: TagView) {
  store.delView(tag.path)
  if (route.path === tag.path) {
    const latest = store.visitedViews[store.visitedViews.length - 1]
    router.push(latest.fullPath)
  }
}

function addRouteView() {
  const title = route.meta.title
  if (typeof title !== 'string' || !title) return
  store.addView({
    path: route.path,
    fullPath: route.fullPath,
    title,
  })
}

addRouteView()

watch(
  () => route.fullPath,
  () => addRouteView(),
)
</script>

<style scoped>
.tags-view {
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  overflow: hidden;
}

.tags-view__scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tags-view__scroll::-webkit-scrollbar {
  display: none;
}

.tags-view__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  color: #495060;
  background-color: #ffffff;
  border: 1px solid #d8dce5;
  border-radius: 2px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.tags-view__item.is-active {
  color: #ffffff;
  background-color: #409eff;
  border-color: #409eff;
}

.tags-view__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #c0c4cc;
}

.tags-view__item.is-active .tags-view__dot {
  background-color: #ffffff;
}

.tags-view__close {
  font-size: 12px;
  border-radius: 50%;
}

.tags-view__close:hover {
  background-color: rgba(0, 0, 0, 0.16);
  color: #ffffff;
}
</style>