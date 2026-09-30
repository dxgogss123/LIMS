// 检测项接口封装。
// 当前为 mock 实现；后端接口就绪后替换为真实请求，例如：
//   import http from './http'
//   return http.get('/api/test-items', { params: query })

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

const mockItems: TestItem[] = Array.from({ length: 46 }, (_, i) => {
  const n = i + 1
  return {
    id: n,
    code: `XM-${String(n).padStart(4, '0')}`,
    name: `检测项${n}`,
    standard: n % 2 === 0 ? 'GB/T 7725' : 'IEC 60335',
    unit: n % 3 === 0 ? '℃' : n % 3 === 1 ? '%' : 'Pa',
  }
})

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 300)
  })
}

export function getTestItemList(
  query: TestItemQuery
): Promise<TestItemListResult> {
  const { keyword, page, pageSize } = query
  let list = mockItems

  if (keyword) {
    list = list.filter(
      (it) => it.name.includes(keyword) || it.code.includes(keyword)
    )
  }

  const start = (page - 1) * pageSize
  const items = list.slice(start, start + pageSize)

  return delay({ items, total: list.length, page, pageSize })
}