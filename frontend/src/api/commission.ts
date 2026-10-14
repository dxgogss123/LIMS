// 新增委托接口封装。
// 汇总「委托人管理 / 基础数据 / 实验室管理」三块已有数据源，
// 并为委托单提供提交与工具函数。提交与查询均对接后端 /api/store/commission。
import type { UploadUserFile } from 'element-plus'
import http from './http'
import {
  getClientList,
  type ClientItem,
  type ClientQuery,
  type ClientListResult,
} from './client'
import {
  getSampleTypeList,
  getTestPurposeList,
  getLabList,
  getLabTestItems,
  type ListQuery,
  type ListResult,
  type SampleType,
  type TestPurpose,
  type Lab,
  type LabTestItem,
  type TestItemFilter,
} from './system'

export type {
  ClientItem,
  ClientQuery,
  ClientListResult,
  ListQuery,
  ListResult,
  SampleType,
  TestPurpose,
  Lab,
  LabTestItem,
  TestItemFilter,
}

// ---------- 数据源封装（分页 / 搜索参数透传） ----------

export function fetchClientList(query: ClientQuery): Promise<ClientListResult> {
  return getClientList(query)
}

export function fetchSampleTypeList(query: ListQuery): Promise<ListResult<SampleType>> {
  return getSampleTypeList(query)
}

export function fetchTestPurposeList(query: ListQuery): Promise<ListResult<TestPurpose>> {
  return getTestPurposeList(query)
}

export function fetchLabList(): Promise<Lab[]> {
  return getLabList()
}

export function fetchLabTestItems(labId: number, filter: TestItemFilter): Promise<LabTestItem[]> {
  return getLabTestItems(labId, filter)
}

// ---------- 委托表单类型 ----------

export interface CommissionDetailItem {
  sample_name: string
  sample_type_id: number | null
  test_purpose_id: number | null
  lab_id: number | null
  test_item_id: number | null
  quantity: number
  // 选中测试项目后带出的只读信息
  standard_code: string
  method: string
  duration: string
  status: string
}

export interface CommissionForm {
  commission_no: string
  commission_date: string
  client_id: number | null
  client_name: string
  contact_phone: string
  department: string
  position: string
  project_code: string
  project_name: string
  test_code: string
  sample_model: string
  sample_quantity: number
  sample_type_id: number | null
  test_purpose_id: number | null
  urgency_level: string
  trial_status: string
  eval_engineer: string
  eval_engineer_phone: string
  sample_images: UploadUserFile[]
  delivery_date: string
  is_outsourced: boolean
  outsourced_unit: string
  remark: string
  details: CommissionDetailItem[]
}

export interface CommissionSubmitPayload {
  commission_no: string
  commission_date: string
  client_id: number
  client_name: string
  project_code: string
  project_name: string
  test_code: string
  sample_model: string
  sample_quantity: number
  sample_type_id: number | null
  test_purpose_id: number | null
  urgency_level: string
  trial_status: string
  eval_engineer: string
  eval_engineer_phone: string
  sample_images: UploadUserFile[]
  delivery_date: string
  is_outsourced: boolean
  outsourced_unit: string
  remark: string
  details: CommissionDetailItem[]
}

// ---------- 工具函数 ----------

let commissionSeq = 0

// 生成委托单号：WT-YYYYMMDD-XXXX
export function genCommissionNo(): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate()
  ).padStart(2, '0')}`
  commissionSeq += 1
  return `WT-${ymd}-${String(commissionSeq).padStart(4, '0')}`
}

// 判断测试项目是否适用于指定的样品类型与检测目的。
// sample_type_id / purpose_id 为 null 表示未选中（视为不限）。
export function isTestItemApplicable(
  item: LabTestItem,
  sampleTypeId: number | null,
  purposeId: number | null
): boolean {
  const matchSample = sampleTypeId == null || item.sample_type_ids.includes(sampleTypeId)
  const matchPurpose = purposeId == null || item.purpose_ids.includes(purposeId)
  return matchSample && matchPurpose
}

// ---------- 提交 ----------

export async function createCommission(
  payload: CommissionSubmitPayload
): Promise<{ id: number }> {
  // 样机图片中 File 对象无法 JSON 序列化，仅保留可序列化字段。
  const sample_images = (payload.sample_images ?? []).map((img) => ({
    name: img.name,
    url: img.url ?? '',
  }))
  const { data } = await http.post<{ id: number }>('/api/store/commission', {
    ...payload,
    sample_images,
    created_at: new Date().toISOString(),
  })
  return data
}

// ---------- 样机入库联动：已完成/已审核委托单 + 委托样品明细 ----------

export interface CommissionOption {
  id: number
  commission_no: string
  client: string
}

export interface SampleOption {
  detail_id: number
  sample_name: string
  sample_type: string
  total_quantity: number
  stocked_quantity: number
}

// 委托单列表记录（后端 commission 集合的返回结构）。
interface CommissionRecord {
  id: number
  commission_no: string
  client_name: string
  trial_status: string
  details: CommissionDetailItem[]
}

async function fetchCommissionRecords(): Promise<CommissionRecord[]> {
  const { data } = await http.get<ListResult<CommissionRecord>>('/api/store/commission', {
    params: { page: 1, page_size: 1000 },
  })
  return data.items
}

// 已入库可选委托单（仅「已完成 / 已归档」状态）。
export async function fetchCompletedCommissions(keyword?: string): Promise<CommissionOption[]> {
  const kw = (keyword || '').trim().toLowerCase()
  const items = await fetchCommissionRecords()
  return items
    .filter((it) => it.trial_status === '已完成' || it.trial_status === '已归档')
    .filter(
      (it) =>
        !kw ||
        it.commission_no.toLowerCase().includes(kw) ||
        it.client_name.toLowerCase().includes(kw)
    )
    .map((it) => ({ id: it.id, commission_no: it.commission_no, client: it.client_name }))
}

// 委托单样品检测明细（total_quantity 为委托总量，stocked_quantity 为已入库量）。
export async function fetchCommissionSamples(commissionId: number): Promise<SampleOption[]> {
  const { data } = await http.get<CommissionRecord>(`/api/store/commission/${commissionId}`)
  if (!data?.details?.length) return []
  const { items: sampleTypes } = await getSampleTypeList({ page: 1, page_size: 1000 })
  return data.details.map((d, i) => ({
    detail_id: i,
    sample_name: d.sample_name,
    sample_type: sampleTypes.find((st) => st.id === d.sample_type_id)?.name ?? '',
    total_quantity: d.quantity,
    stocked_quantity: 0,
  }))
}