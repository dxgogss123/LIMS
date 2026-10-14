import { defineStore } from 'pinia'
import {
  getSampleTypeList,
  getTestPurposeList,
  getLabList,
  type SampleType,
  type TestPurpose,
  type Lab,
} from '@/api/system'

// 全局字典：缓存启用状态的样品类型 / 检测目的 / 实验室，避免重复请求。
export const useDictStore = defineStore('dict', {
  state: (): {
    sampleTypes: SampleType[]
    testPurposes: TestPurpose[]
    labs: Lab[]
    loaded: boolean
    loading: boolean
  } => ({
    sampleTypes: [],
    testPurposes: [],
    labs: [],
    loaded: false,
    loading: false,
  }),
  getters: {
    enabledSampleTypes: (state): SampleType[] =>
      state.sampleTypes.filter((it) => it.status === 'enabled'),
    enabledTestPurposes: (state): TestPurpose[] =>
      state.testPurposes.filter((it) => it.status === 'enabled'),
    enabledLabs: (state): Lab[] => state.labs.filter((it) => it.status === 'enabled'),
  },
  actions: {
    async ensureLoaded() {
      if (this.loaded || this.loading) return
      this.loading = true
      try {
        const [sampleRes, purposeRes, labs] = await Promise.all([
          getSampleTypeList({ page: 1, page_size: 1000 }),
          getTestPurposeList({ page: 1, page_size: 1000 }),
          getLabList(),
        ])
        this.sampleTypes = sampleRes.items
        this.testPurposes = purposeRes.items
        this.labs = labs
        this.loaded = true
      } finally {
        this.loading = false
      }
    },
  },
})