// 样机台账接口封装（路径 /api/store/sample_ledger，流通记录 /api/store/sample_flow）。

import http from './http'

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

const FILTER_FIELDS = [
  'sample_no',
  'name',
  'spec',
  'project_no',
  'location',
  'status',
  'updated_by',
  'batch',
  'storage_area',
  'test_purpose',
] as const

export async function getSampleList(query: SampleQuery): Promise<SampleListResult> {
  const params: Record<string, unknown> = {
    page: query.page,
    page_size: query.page_size,
  }
  for (const field of FILTER_FIELDS) {
    const value = query[field]
    if (value) params[field] = value
  }
  const { data } = await http.get<SampleListResult>('/api/store/sample_ledger', {
    params,
  })
  return data
}

export async function getSampleFlows(sampleNo: string): Promise<SampleFlowRecord[]> {
  const { data } = await http.get<{ items: SampleFlowRecord[] }>(
    '/api/store/sample_flow',
    { params: { page: 1, page_size: 1000, sample_no: sampleNo } }
  )
  return data.items
}

export async function createSample(payload: Partial<SampleItem>): Promise<SampleItem> {
  const { data } = await http.post<SampleItem>('/api/store/sample_ledger', {
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
  })
  return data
}

export async function updateSample(_id: number, payload: Partial<SampleItem>): Promise<SampleItem> {
  const { data } = await http.put<SampleItem>(
    `/api/store/sample_ledger/${_id}`,
    payload
  )
  return data
}