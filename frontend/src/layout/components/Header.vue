<template>
  <header class="header">
    <div class="header__left">
      <span class="header__collapse" @click="emit('toggle')">
        <el-icon :size="18">
          <Expand v-if="collapsed" />
          <Fold v-else />
        </el-icon>
      </span>

      <div class="header__logo">
        <span class="header__logo-mark">
          <el-icon :size="16"><Monitor /></el-icon>
        </span>
        <span class="header__logo-text">TCL LIMS | 实验室管理系统</span>
      </div>
    </div>

    <div class="header__right">
      <el-tooltip content="全屏" placement="bottom">
        <span class="header__action" @click="toggleFullscreen">
          <el-icon :size="18"><FullScreen /></el-icon>
        </span>
      </el-tooltip>

      <el-select v-model="lab" class="header__lab">
        <el-option label="安全结构实验室" value="安全结构实验室" />
      </el-select>

      <el-tooltip content="通知" placement="bottom">
        <span class="header__action">
          <el-badge :value="3" :offset="[0, 2]">
            <el-icon :size="18"><Bell /></el-icon>
          </el-badge>
        </span>
      </el-tooltip>

      <el-tooltip content="帮助" placement="bottom">
        <span class="header__action">
          <el-icon :size="18"><QuestionFilled /></el-icon>
        </span>
      </el-tooltip>

      <el-dropdown trigger="click">
        <span class="header__avatar">
          <el-avatar :size="30">L</el-avatar>
          <span class="header__avatar-name">LIMS 用户</span>
          <el-icon :size="14"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>安全结构实验室</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  ArrowDown,
  Bell,
  Expand,
  Fold,
  FullScreen,
  Monitor,
  QuestionFilled,
  SwitchButton,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

defineProps<{ collapsed: boolean }>()
const emit = defineEmits<{ (e: 'toggle'): void }>()

const lab = ref('安全结构实验室')

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

function handleLogout() {
  ElMessage.info('退出登录（占位）')
}
</script>

<style scoped>
.header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 16px;
  background-color: #001529;
  color: #ffffff;
}

.header__left {
  display: flex;
  align-items: center;
  height: 100%;
}

.header__collapse {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 100%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.header__collapse:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.header__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.header__logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: linear-gradient(135deg, #1890ff, #40a9ff);
}

.header__logo-text {
  font-size: 15px;
  font-weight: 600;
}

.header__right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header__action {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #ffffff;
}

.header__lab {
  width: 150px;
}

.header__lab :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none;
}

.header__lab :deep(.el-input__inner) {
  color: #ffffff;
}

.header__avatar {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #ffffff;
}

.header__avatar-name {
  font-size: 14px;
}
</style>