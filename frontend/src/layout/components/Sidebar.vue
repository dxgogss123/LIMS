<template>
  <aside class="sidebar" :class="{ 'is-collapsed': collapsed }">
    <el-menu
      class="sidebar__menu"
      :default-active="route.path"
      :collapse="collapsed"
      :collapse-transition="false"
      background-color="#002140"
      text-color="#ffffff"
      active-text-color="#ffffff"
      router
    >
      <template v-for="item in menus" :key="item.title">
        <el-sub-menu v-if="item.children" :index="item.title">
          <template #title>
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </template>
          <el-menu-item
            v-for="child in item.children"
            :key="child.path"
            :index="child.path"
          >
            <el-icon><component :is="child.icon" /></el-icon>
            <template #title>{{ child.title }}</template>
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item v-else :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </template>
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

interface MenuChild {
  title: string
  path: string
  icon: string
}

interface MenuItem {
  title: string
  path?: string
  icon?: string
  children?: MenuChild[]
}

defineProps<{ collapsed: boolean }>()

const route = useRoute()

const menus: MenuItem[] = [
  { title: '系统首页', path: '/dashboard', icon: 'HomeFilled' },
  { title: '委托管理', path: '/entrust', icon: 'Memo' },
  { title: '样机台账', path: '/sample-ledger', icon: 'Box' },
  {
    title: '测试管理',
    icon: 'List',
    children: [
      { title: '待测单', path: '/test/pending', icon: 'Clock' },
      { title: '在测单', path: '/test/ongoing', icon: 'Loading' },
      { title: '已测单', path: '/test/done', icon: 'CircleCheck' },
    ],
  },
  {
    title: '文件管理',
    icon: 'FolderOpened',
    children: [
      { title: '作业指导书', path: '/file/wi', icon: 'Document' },
      { title: '实验室文件', path: '/file/lab', icon: 'Folder' },
    ],
  },
  {
    title: '用户管理',
    icon: 'User',
    children: [
      { title: '账号管理', path: '/user/account', icon: 'User' },
      { title: '委托人管理', path: '/user/client', icon: 'UserFilled' },
    ],
  },
  {
    title: '系统设置',
    icon: 'Setting',
    children: [
      { title: '基础数据', path: '/base-data', icon: 'Coin' },
      { title: '实验室管理', path: '/lab', icon: 'OfficeBuilding' },
    ],
  },
]
</script>

<style scoped>
.sidebar {
  width: 220px;
  flex-shrink: 0;
  background-color: #002140;
  transition: width 0.28s;
  overflow: hidden;
}

.sidebar.is-collapsed {
  width: 64px;
}

.sidebar__menu {
  width: 100%;
  border-right: none;
}

.sidebar :deep(.el-menu-item) {
  position: relative;
}

/* 激活项：左侧蓝色竖条 + 背景高亮 */
.sidebar :deep(.el-menu-item.is-active) {
  background-color: #1890ff;
  color: #ffffff;
}

.sidebar :deep(.el-menu-item.is-active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #40a9ff;
}

/* hover 时背景变浅 */
.sidebar :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.08);
}

.sidebar :deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.08);
}
</style>