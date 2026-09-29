// 样机台账接口封装（对应 sample 表）。
// 当前为 mock 实现；后端接口就绪后替换为真实请求。

export const SAMPLE_STATUSES = ['在库', '在测', '已测完', '已处置', '报废'] as const
export type SampleStatus = (typeof SAMPLE_STATUSES)[number]

export interface SampleItem {
  id: number
  sample_no: string
  name: string
  spec: string
  project_no: string
  location: string
  status: SampleStatus
  receive_date: string
  dispose_date: string
}

export interface SampleQuery {
  page: number
  page_size: number
  sample_no?: string
  keyword?: string
  project_no?: string
  status?: string
  [key: string]: unknown
}

export interface SampleListResult {
  items: SampleItem[]
  total: number
  page: number
  page_size: number
}

// ---- mock 数据 ----

const mockData: SampleItem[] = [
  { id: 1, sample_no: 'SMP-2026-0001', name: '502C样机-01', spec: '502C', project_no: 'LAB2026-0001', location: '样机库 A 区', status: '在库', receive_date: '2026-08-01', dispose_date: '' },
  { id: 2, sample_no: 'SMP-2026-0002', name: '502C样机-02', spec: '502C', project_no: 'LAB2026-0002', location: '样机库 A 区', status: '在库', receive_date: '2026-08-03', dispose_date: '' },
  { id: 3, sample_no: 'SMP-2026-0003', name: '301H样机-01', spec: '301H', project_no: 'LAB2026-0003', location: '性能实验室', status: '在测', receive_date: '2026-08-05', dispose_date: '' },
  { id: 4, sample_no: 'SMP-2026-0004', name: '301H样机-02', spec: '301H', project_no: 'LAB2026-0004', location: '寿命实验室', status: '在测', receive_date: '2026-08-06', dispose_date: '' },
  { id: 5, sample_no: 'SMP-2026-0005', name: '602X样机-01', spec: '602X', project_no: 'LAB2026-0005', location: '样机库 B 区', status: '已测完', receive_date: '2026-07-20', dispose_date: '' },
  { id: 6, sample_no: 'SMP-2026-0006', name: '602X样机-02', spec: '602X', project_no: 'LAB2026-0006', location: '样机库 B 区', status: '已测完', receive_date: '2026-07-21', dispose_date: '' },
  { id: 7, sample_no: 'SMP-2026-0007', name: '701Y样机-01', spec: '701Y', project_no: 'LAB2026-0007', location: '-', status: '已处置', receive_date: '2026-06-10', dispose_date: '2026-09-15' },
  { id: 8, sample_no: 'SMP-2026-0008', name: '701Y样机-02', spec: '701Y', project_no: 'LAB2026-0008', location: '-', status: '报废', receive_date: '2026-06-10', dispose_date: '2026-09-20' },
]

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 300)
  })
}

export function getSampleList(query: SampleQuery): Promise<SampleListResult> {
  const { page, page_size } = query
  let list = mockData

  const sampleNo = String(query.sample_no ?? '')
  if (sampleNo) list = list.filter((it) => it.sample_no.includes(sampleNo))

  const keyword = String(query.keyword ?? '')
  if (keyword) list = list.filter((it) => it.name.includes(keyword) || it.spec.includes(keyword))

  const projectNo = String(query.project_no ?? '')
  if (projectNo) list = list.filter((it) => it.project_no.includes(projectNo))

  const status = String(query.status ?? '')
  if (status) list = list.filter((it) => it.status === status)

  return delay({ items: list, total: list.length, page, page_size })
}

export function createSample(payload: Partial<SampleItem>): Promise<SampleItem> {
  return delay({
    id: Date.now(),
    sample_no: '',
    name: '',
    spec: '',
    project_no: '',
    location: '',
    status: '在库',
    receive_date: '',
    dispose_date: '',
    ...payload,
  } as SampleItem)
}