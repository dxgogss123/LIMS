// 样机台账接口封装（对应 sample 表，路径 /api/sample-ledger）。
// 当前为 mock 实现；后端接口就绪后替换为真实 http 请求。

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
  batch: string
  storage_area: string
  test_purpose: string
  updated_by: string
  remark: string
}

export interface SampleQuery {
  page: number
  page_size: number
  sample_no?: string
  name?: string
  spec?: string
  project_no?: string
  location?: string
  status?: string
  updated_by?: string
  batch?: string
  storage_area?: string
  test_purpose?: string
  [key: string]: unknown
}

export interface SampleListResult {
  items: SampleItem[]
  total: number
  page: number
  page_size: number
}

export interface SampleFlowRecord {
  time: string
  action: string
  from_status: string
  to_status: string
  operator: string
  remark: string
}

// ---- mock 数据 ----

const mockData: SampleItem[] = [
  { id: 1, sample_no: 'SMP-2026-0001', name: '502C样机-01', spec: '502C', project_no: 'LAB2026-0001', location: '样机库 A 区', status: '在库', receive_date: '2026-08-01', dispose_date: '', batch: 'PC20260801', storage_area: 'A区', test_purpose: '性能验证', updated_by: '张三', remark: '' },
  { id: 2, sample_no: 'SMP-2026-0002', name: '502C样机-02', spec: '502C', project_no: 'LAB2026-0002', location: '样机库 A 区', status: '在库', receive_date: '2026-08-03', dispose_date: '', batch: 'PC20260803', storage_area: 'A区', test_purpose: '性能验证', updated_by: '张三', remark: '' },
  { id: 3, sample_no: 'SMP-2026-0003', name: '301H样机-01', spec: '301H', project_no: 'LAB2026-0003', location: '性能实验室', status: '在测', receive_date: '2026-08-05', dispose_date: '', batch: 'PC20260805', storage_area: 'B区', test_purpose: '可靠性验证', updated_by: '李四', remark: '' },
  { id: 4, sample_no: 'SMP-2026-0004', name: '301H样机-02', spec: '301H', project_no: 'LAB2026-0004', location: '寿命实验室', status: '在测', receive_date: '2026-08-06', dispose_date: '', batch: 'PC20260806', storage_area: 'B区', test_purpose: '可靠性验证', updated_by: '李四', remark: '' },
  { id: 5, sample_no: 'SMP-2026-0005', name: '602X样机-01', spec: '602X', project_no: 'LAB2026-0005', location: '样机库 B 区', status: '已测完', receive_date: '2026-07-20', dispose_date: '', batch: 'PC20260720', storage_area: 'B区', test_purpose: '型式试验', updated_by: '王五', remark: '' },
  { id: 6, sample_no: 'SMP-2026-0006', name: '602X样机-02', spec: '602X', project_no: 'LAB2026-0006', location: '样机库 B 区', status: '已测完', receive_date: '2026-07-21', dispose_date: '', batch: 'PC20260721', storage_area: 'B区', test_purpose: '型式试验', updated_by: '王五', remark: '' },
  { id: 7, sample_no: 'SMP-2026-0007', name: '701Y样机-01', spec: '701Y', project_no: 'LAB2026-0007', location: '-', status: '已处置', receive_date: '2026-06-10', dispose_date: '2026-09-15', batch: 'PC20260610', storage_area: 'C区', test_purpose: '摸底测试', updated_by: '赵六', remark: '处置完成' },
  { id: 8, sample_no: 'SMP-2026-0008', name: '701Y样机-02', spec: '701Y', project_no: 'LAB2026-0008', location: '-', status: '报废', receive_date: '2026-06-10', dispose_date: '2026-09-20', batch: 'PC20260610', storage_area: 'C区', test_purpose: '摸底测试', updated_by: '赵六', remark: '报废' },
  { id: 9, sample_no: 'SMP-2026-0009', name: '801K样机-01', spec: '801K', project_no: 'LAB2026-0009', location: '样机库 A 区', status: '在库', receive_date: '2026-08-10', dispose_date: '', batch: 'PC20260810', storage_area: 'A区', test_purpose: '性能验证', updated_by: '张三', remark: '' },
  { id: 10, sample_no: 'SMP-2026-0010', name: '801K样机-02', spec: '801K', project_no: 'LAB2026-0010', location: '环境实验室', status: '在测', receive_date: '2026-08-11', dispose_date: '', batch: 'PC20260811', storage_area: 'A区', test_purpose: '可靠性验证', updated_by: '李四', remark: '' },
  { id: 11, sample_no: 'SMP-2026-0011', name: '902M样机-01', spec: '902M', project_no: 'LAB2026-0011', location: '样机库 C 区', status: '已测完', receive_date: '2026-08-12', dispose_date: '', batch: 'PC20260812', storage_area: 'C区', test_purpose: '型式试验', updated_by: '王五', remark: '' },
  { id: 12, sample_no: 'SMP-2026-0012', name: '902M样机-02', spec: '902M', project_no: 'LAB2026-0012', location: '样机库 C 区', status: '在库', receive_date: '2026-08-15', dispose_date: '', batch: 'PC20260815', storage_area: 'C区', test_purpose: '性能验证', updated_by: '张三', remark: '' },
]

const mockFlows: SampleFlowRecord[] = [
  { time: '2026-08-01 09:12', action: '入库', from_status: '-', to_status: '在库', operator: '张三', remark: '样机进场登记' },
  { time: '2026-08-05 14:30', action: '领用', from_status: '在库', to_status: '在测', operator: '李四', remark: '领用至性能实验室' },
  { time: '2026-08-20 10:05', action: '归还', from_status: '在测', to_status: '已测完', operator: '李四', remark: '试验完成归还' },
]

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), 300)
  })
}

export function getSampleList(query: SampleQuery): Promise<SampleListResult> {
  const { page, page_size } = query
  let list = mockData

  if (query.sample_no) list = list.filter((it) => it.sample_no.includes(String(query.sample_no)))
  if (query.name) list = list.filter((it) => it.name.includes(String(query.name)))
  if (query.spec) list = list.filter((it) => it.spec.includes(String(query.spec)))
  if (query.project_no) list = list.filter((it) => it.project_no.includes(String(query.project_no)))
  if (query.location) list = list.filter((it) => it.location.includes(String(query.location)))
  if (query.status) list = list.filter((it) => it.status === query.status)
  if (query.updated_by) list = list.filter((it) => it.updated_by.includes(String(query.updated_by)))
  if (query.batch) list = list.filter((it) => it.batch.includes(String(query.batch)))

  const total = list.length
  const start = (page - 1) * page_size
  const items = list.slice(start, start + page_size)

  return delay({ items, total, page, page_size })
}

export function getSampleFlows(_sampleNo: string): Promise<SampleFlowRecord[]> {
  return delay(mockFlows)
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
    batch: '',
    storage_area: '',
    test_purpose: '',
    updated_by: '',
    remark: '',
    ...payload,
  } as SampleItem)
}

export function updateSample(_id: number, payload: Partial<SampleItem>): Promise<SampleItem> {
  return delay(payload as SampleItem)
}