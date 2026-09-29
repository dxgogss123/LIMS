// 委托管理接口封装。
// 当前为 mock 实现；后端接口就绪后替换为真实请求，例如：
//   import http from './http'
//   return http.get('/api/entrust', { params: query })

export type EntrustStatus =
  | 'draft'
  | 'auditing'
  | 'audited'
  | 'pending'
  | 'binding'
  | 'onstage'
  | 'testing'
  | 'report_making'
  | 'report_auditing'
  | 'report_rejected'
  | 'terminated'

export interface MachineInfo {
  code: string
  name: string
  appearance_model: string
  fan_motor: string
  motor_speed: string
  capillary_size: string
  hose_version: string
}

export interface EntrustItem {
  id: number
  project_no: string
  project_name: string
  test_code: string
  test_purpose: string
  sample_model: string
  sample_name: string
  test_category: string
  entrust_dept: string
  team: string
  client: string
  status: EntrustStatus
  lab?: string
  entrust_no?: string
  plan_approve_status?: string
  sample_count?: number
  plan_start_time?: string
  onstage_time?: string
  remark?: string
  machines?: MachineInfo[]
}

export interface EntrustQuery {
  page: number
  page_size: number
  status?: string
  [key: string]: unknown
}

export interface EntrustListResult {
  items: EntrustItem[]
  total: number
  page: number
  page_size: number
}

// ---- mock 数据 ----

const statusPool: EntrustStatus[] = [
  'auditing',
  'testing',
  'report_auditing',
  'audited',
  'pending',
  'binding',
  'onstage',
  'report_making',
  'draft',
  'report_rejected',
]

const clientPool = ['张伟', '李娜', '王强', '赵敏']

const mockData: EntrustItem[] = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1
  return {
    id: n,
    project_no: `PMW-CN-2026-${String(n).padStart(4, '0')}`,
    project_name: `502C客厅机${n}号样机舒适性测试`,
    test_code: `PLMKT-2609-${String(n).padStart(4, '0')}`,
    test_purpose: n % 2 === 0 ? '性能验证' : '可靠性验证',
    sample_model: '502C',
    sample_name: `502C样机-${n}`,
    test_category: n % 2 === 0 ? '性能测试' : '寿命测试',
    entrust_dept: '研发中心',
    team: `测试${(n % 3) + 1}组`,
    client: clientPool[n % clientPool.length],
    status: statusPool[i % statusPool.length],
    lab: '安全结构实验室',
    entrust_no: `WT-2026-${String(n).padStart(4, '0')}`,
    plan_approve_status: n % 2 === 0 ? '已审批' : '待审批',
    sample_count: n,
    plan_start_time: '2026-08-01',
    onstage_time: '2026-08-10',
    remark: '',
    machines: [],
  }
})

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 300)
  })
}

export function getEntrustList(
  query: EntrustQuery
): Promise<EntrustListResult> {
  const { page, page_size, status } = query
  let list = mockData

  if (status) {
    list = list.filter((it) => it.status === status)
  }

  const keywordFields = ['project_no', 'project_name', 'test_code'] as const
  for (const field of keywordFields) {
    const kw = String(query[field] ?? '')
    if (kw) {
      list = list.filter((it) => it[field].includes(kw))
    }
  }

  const client = String(query.client ?? '')
  if (client) {
    list = list.filter((it) => it.client.includes(client))
  }

  return delay({
    items: list,
    total: status ? list.length : 4343,
    page,
    page_size,
  })
}

export function getEntrustDetail(
  id: number
): Promise<EntrustItem | null> {
  return delay(mockData.find((it) => it.id === id) ?? null)
}

export function createEntrust(
  payload: Partial<EntrustItem>
): Promise<EntrustItem> {
  return delay({
    id: Date.now(),
    project_no: '',
    project_name: '',
    test_code: '',
    test_purpose: '',
    sample_model: '',
    sample_name: '',
    test_category: '',
    entrust_dept: '',
    team: '',
    client: '',
    status: 'draft',
    ...payload,
  } as EntrustItem)
}

export function updateEntrust(
  id: number,
  payload: Partial<EntrustItem>
): Promise<EntrustItem> {
  const target = mockData.find((it) => it.id === id) ?? mockData[0]
  return delay({ ...target, ...payload, id } as EntrustItem)
}