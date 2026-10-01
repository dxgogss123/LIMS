// 检测项接口封装（路径 /api/store/detection_item）。

import http from './http'

export interface TestItem {
  id: number
  code: string
  name: string
  standard: string
  unit: string
}

export interface TestItemQuery {
  keyword?: string
  page: number
  pageSize: number
}

export interface TestItemListResult {
  items: TestItem[]
  total: number
  page: number
  pageSize: number
}

export async function getTestItemList(
  query: TestItemQuery
): Promise<TestItemListResult> {
  const { data } = await http.get<{
    items: TestItem[]
    total: number
    page: number
    page_size: number
  }>('/api/store/detection_item', {
    params: {
      keyword: query.keyword || undefined,
      page: query.page,
      page_size: query.pageSize,
    },
  })
  return {
    items: data.items,
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
  }
}