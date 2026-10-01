import { defineStore } from 'pinia'

// 当前登录用户（mock）。后端登录/权限接口就绪后替换为真实会话。
export const useUserStore = defineStore('user', {
  state: (): { role: string } => ({
    role: '超级管理员',
  }),
  getters: {
    // 仅管理员类角色可进行增删改操作，其余角色只读
    canManage: (state): boolean => state.role === '超级管理员' || state.role === '管理员',
  },
})