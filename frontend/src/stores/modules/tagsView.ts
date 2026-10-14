import { defineStore } from 'pinia'
import router from '@/router'

export interface TagView {
  path: string
  fullPath: string
  title: string
  affix?: boolean
}

export const useTagsViewStore = defineStore('tagsView', {
  state: (): { visitedViews: TagView[] } => ({
    visitedViews: [
      { path: '/dashboard', fullPath: '/dashboard', title: '系统首页', affix: true },
    ],
  }),
  actions: {
    addView(view: TagView) {
      if (!this.visitedViews.some((v) => v.path === view.path)) {
        this.visitedViews.push(view)
      }
    },
    delView(path: string) {
      const index = this.visitedViews.findIndex((v) => v.path === path)
      if (index !== -1) {
        this.visitedViews.splice(index, 1)
      }
    },
    openTab(view: TagView) {
      this.addView(view)
      router.push(view.fullPath)
    },
  },
})