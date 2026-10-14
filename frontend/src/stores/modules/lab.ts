import { defineStore } from 'pinia'

// 实验室管理页面：当前选中的实验室（跨组件共享选中态）
export const useLabStore = defineStore('lab', {
  state: (): { selectedLabId: number | null } => ({
    selectedLabId: null,
  }),
  actions: {
    selectLab(id: number | null) {
      this.selectedLabId = id
    },
  },
})