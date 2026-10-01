// 委托管理接口封装（路径 /api/store/entrust）。

import http from './http'

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

const FILTER_FIELDS = ['project_no', 'project_name', 'test_code', 'client'] as const

export function getEntrustList(
  query: EntrustQuery
): Promise<EntrustListResult> {
  const params: Record<string, unknown> = {
    page: query.page,
    page_size: query.page_size,
  }
  if (query.status) params.status = query.status
  for (const field of FILTER_FIELDS) {
    const value = query[field]
    if (value) params[field] = value
  }
  return http.get<EntrustListResult>('/api/store/entrust', { params }).then((r) => r.data)
}

export function getEntrustDetail(
  id: number
): Promise<EntrustItem | null> {
  return http
    .get<EntrustItem>(`/api/store/entrust/${id}`)
    .then((r) => r.data)
    .catch(() => null)
}

export function createEntrust(
  payload: Partial<EntrustItem>
): Promise<EntrustItem> {
  return http
    .post<EntrustItem>('/api/store/entrust', {
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
    })
    .then((r) => r.data)
}

export function updateEntrust(
  id: number,
  payload: Partial<EntrustItem>
): Promise<EntrustItem> {
  return http.put<EntrustItem>(`/api/store/entrust/${id}`, payload).then((r) => r.data)
}