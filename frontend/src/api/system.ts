// 系统配置接口封装（基础数据 + 实验室管理），持久化到后端 /api/store/*。
// 基础数据：sample_type / test_purpose；实验室：lab / lab_test_item / lab_template。

import http from './http'

// ---------- 通用类型 ----------

export type EntityStatus = 'enabled' | 'disabled'

export interface ListQuery {
  page: number
  page_size: number
  keyword?: string
  sort_by?: string
  order?: 'asc' | 'desc'
}

export interface ListResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ---------- 基础数据 ----------

export interface SampleType {
  id: number
  name: string
  code: string
  sort_order: number
  status: EntityStatus
  created_at: string
  remark?: string
}

export interface TestPurpose {
  id: number
  name: string
  code: string
  category: string
  sort_order: number
  status: EntityStatus
  created_at: string
  remark?: string
}

// ---------- 实验室管理 ----------

export interface Lab {
  id: number
  name: string
  code: string
  location: string
  manager: string
  contact_phone: string
  status: EntityStatus
  max_capacity: number
  remark?: string
  test_item_count: number
}

export interface LabTestItem {
  id: number
  lab_id: number
  name: string
  standard_code: string
  method: string
  equipment: string
  duration: string
  sample_type_ids: number[]
  purpose_ids: number[]
  status: EntityStatus
}

export interface LabTemplate {
  id: number
  name: string
  description: string
  items: Omit<LabTestItem, 'id' | 'lab_id'>[]
}

// ---------- 操作日志 ----------

export interface OperationLog {
  id: number
  action: string
  content: string
  time: string
}

// ---------- 通用工具 ----------

function now(): string {
  return new Date().toISOString()
}

async function getPaged<T>(
  collection: string,
  params?: Record<string, unknown>
): Promise<ListResult<T>> {
  const { data } = await http.get<ListResult<T>>(`/api/store/${collection}`, {
    params: { page: 1, page_size: 10, ...params },
  })
  return data
}

async function fetchAll<T>(
  collection: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const { data } = await http.get<ListResult<T>>(`/api/store/${collection}`, {
    params: { page: 1, page_size: 1000, ...params },
  })
  return data.items
}

async function createRecord<T>(collection: string, payload: unknown): Promise<T> {
  const { data } = await http.post<T>(`/api/store/${collection}`, payload)
  return data
}

async function updateRecord<T>(
  collection: string,
  id: number,
  payload: unknown
): Promise<T> {
  const { data } = await http.put<T>(`/api/store/${collection}/${id}`, payload)
  return data
}

async function deleteRecords(collection: string, ids: number[]): Promise<void> {
  await http.post(`/api/store/${collection}/batch-delete`, { ids })
}

// 唯一性校验的本地缓存：列表加载后刷新，表单校验时同步使用。
let sampleTypeCache: SampleType[] = []
let testPurposeCache: TestPurpose[] = []

// ---------- 样例类型 ----------

export const PURPOSE_CATEGORIES = ['型式检验', '委托检验', '监督检验', '仲裁检验', '出厂检验', '能力验证'] as const

export function genSampleTypeCode(): string {
  return `ST_${Date.now()}`
}

export function checkSampleTypeCodeUnique(code: string, excludeId?: number): boolean {
  const trimmed = code.trim()
  return !sampleTypeCache.some((it) => it.code === trimmed && it.id !== excludeId)
}

export function checkSampleTypeNameUnique(name: string, excludeId?: number): boolean {
  const trimmed = name.trim()
  return !sampleTypeCache.some((it) => it.name === trimmed && it.id !== excludeId)
}

export type SampleTypePayload = Omit<SampleType, 'id' | 'created_at' | 'status'>

export async function getSampleTypeList(
  query: ListQuery
): Promise<ListResult<SampleType>> {
  const result = await getPaged<SampleType>('sample_type', {
    page: query.page,
    page_size: query.page_size,
    keyword: query.keyword || undefined,
    sort_by: query.sort_by || undefined,
    order: query.order || undefined,
  })
  sampleTypeCache = result.items
  return result
}

export async function createSampleType(
  payload: SampleTypePayload
): Promise<SampleType> {
  if (!checkSampleTypeCodeUnique(payload.code)) {
    throw new Error('样品类型编码已存在')
  }
  const item = await createRecord<SampleType>('sample_type', {
    ...payload,
    status: 'enabled',
    created_at: now(),
  })
  sampleTypeCache = [item, ...sampleTypeCache]
  return item
}

export async function updateSampleType(
  id: number,
  payload: SampleTypePayload
): Promise<SampleType> {
  if (!checkSampleTypeCodeUnique(payload.code, id)) {
    throw new Error('样品类型编码已存在')
  }
  const item = await updateRecord<SampleType>('sample_type', id, payload)
  sampleTypeCache = sampleTypeCache.map((it) => (it.id === id ? item : it))
  return item
}

export async function deleteSampleTypes(ids: number[]): Promise<void> {
  await deleteRecords('sample_type', ids)
  sampleTypeCache = sampleTypeCache.filter((it) => !ids.includes(it.id))
}

export async function toggleSampleTypeStatus(
  id: number,
  status: EntityStatus
): Promise<SampleType> {
  const item = await updateRecord<SampleType>('sample_type', id, { status })
  sampleTypeCache = sampleTypeCache.map((it) => (it.id === id ? item : it))
  return item
}

// ---------- 检测目的 ----------

export function genTestPurposeCode(): string {
  return `TP_${Date.now()}`
}

export function checkTestPurposeCodeUnique(code: string, excludeId?: number): boolean {
  const trimmed = code.trim()
  return !testPurposeCache.some((it) => it.code === trimmed && it.id !== excludeId)
}

export function checkTestPurposeNameUnique(name: string, excludeId?: number): boolean {
  const trimmed = name.trim()
  return !testPurposeCache.some((it) => it.name === trimmed && it.id !== excludeId)
}

export type TestPurposePayload = Omit<TestPurpose, 'id' | 'created_at' | 'status'>

export async function getTestPurposeList(
  query: ListQuery
): Promise<ListResult<TestPurpose>> {
  const result = await getPaged<TestPurpose>('test_purpose', {
    page: query.page,
    page_size: query.page_size,
    keyword: query.keyword || undefined,
    sort_by: query.sort_by || undefined,
    order: query.order || undefined,
  })
  testPurposeCache = result.items
  return result
}

export async function createTestPurpose(
  payload: TestPurposePayload
): Promise<TestPurpose> {
  if (!checkTestPurposeCodeUnique(payload.code)) {
    throw new Error('检测目的编码已存在')
  }
  const item = await createRecord<TestPurpose>('test_purpose', {
    ...payload,
    status: 'enabled',
    created_at: now(),
  })
  testPurposeCache = [item, ...testPurposeCache]
  return item
}

export async function updateTestPurpose(
  id: number,
  payload: TestPurposePayload
): Promise<TestPurpose> {
  if (!checkTestPurposeCodeUnique(payload.code, id)) {
    throw new Error('检测目的编码已存在')
  }
  const item = await updateRecord<TestPurpose>('test_purpose', id, payload)
  testPurposeCache = testPurposeCache.map((it) => (it.id === id ? item : it))
  return item
}

export async function deleteTestPurposes(ids: number[]): Promise<void> {
  await deleteRecords('test_purpose', ids)
  testPurposeCache = testPurposeCache.filter((it) => !ids.includes(it.id))
}

export async function toggleTestPurposeStatus(
  id: number,
  status: EntityStatus
): Promise<TestPurpose> {
  const item = await updateRecord<TestPurpose>('test_purpose', id, { status })
  testPurposeCache = testPurposeCache.map((it) => (it.id === id ? item : it))
  return item
}

// ---------- 实验室 ----------

export type LabPayload = Omit<Lab, 'id' | 'test_item_count'>

function countItems(labId: number, items: LabTestItem[]): number {
  return items.filter((it) => it.lab_id === labId).length
}

export async function getLabList(): Promise<Lab[]> {
  const [labs, items] = await Promise.all([
    fetchAll<Omit<Lab, 'test_item_count'>>('lab'),
    fetchAll<LabTestItem>('lab_test_item'),
  ])
  return labs.map((it) => ({ ...it, test_item_count: countItems(it.id, items) }))
}

export async function getLabTemplates(): Promise<LabTemplate[]> {
  return fetchAll<LabTemplate>('lab_template')
}

export async function createLab(payload: LabPayload, templateId?: number): Promise<Lab> {
  const lab = await createRecord<Omit<Lab, 'test_item_count'>>('lab', payload)
  let count = 0
  if (templateId) {
    const tpl = (await getLabTemplates()).find((t) => t.id === templateId)
    if (tpl) {
      count = tpl.items.length
      await Promise.all(
        tpl.items.map((it) =>
          createRecord('lab_test_item', {
            ...it,
            id: undefined,
            lab_id: lab.id,
          })
        )
      )
    }
  }
  return { ...lab, test_item_count: count }
}

export async function updateLab(id: number, payload: LabPayload): Promise<Lab> {
  return updateRecord<Lab>('lab', id, payload)
}

export async function deleteLab(id: number): Promise<void> {
  await http.delete(`/api/store/lab/${id}`)
  const items = await fetchAll<LabTestItem>('lab_test_item', { lab_id: id })
  if (items.length) {
    await deleteRecords('lab_test_item', items.map((it) => it.id))
  }
}

// 快速编辑：仅更新名称与负责人
export async function quickEditLab(id: number, name: string, manager: string): Promise<Lab> {
  return updateRecord<Lab>('lab', id, { name, manager })
}

// 复制实验室配置（结构 + 测试项目）
export async function cloneLabConfig(id: number): Promise<Lab> {
  const { data: src } = await http.get<Lab>(`/api/store/lab/${id}`)
  if (!src) throw new Error('实验室不存在')
  const clone = await createRecord<Lab>('lab', {
    name: `${src.name}（副本）`,
    code: `${src.code}_CP`,
    location: src.location,
    manager: src.manager,
    contact_phone: src.contact_phone,
    status: src.status,
    max_capacity: src.max_capacity,
    remark: src.remark,
  })
  const items = await fetchAll<LabTestItem>('lab_test_item', { lab_id: id })
  await Promise.all(
    items.map((it) =>
      createRecord('lab_test_item', {
        ...it,
        id: undefined,
        lab_id: clone.id,
      })
    )
  )
  return { ...clone, test_item_count: items.length }
}

// 将一个实验室的项目批量复制到另一个实验室
export async function copyTestItems(sourceLabId: number, targetLabId: number): Promise<number> {
  const srcItems = await fetchAll<LabTestItem>('lab_test_item', { lab_id: sourceLabId })
  await Promise.all(
    srcItems.map((it) =>
      createRecord('lab_test_item', {
        ...it,
        id: undefined,
        lab_id: targetLabId,
      })
    )
  )
  return srcItems.length
}

// 实验室拖拽排序：后端按 id 倒序存储，暂不持久化顺序。
export async function reorderLabs(_orderedIds: number[]): Promise<void> {
  return Promise.resolve()
}

// ---------- 测试项目 ----------

export interface TestItemFilter {
  standard?: string
  method?: string
}

export type LabTestItemPayload = Omit<LabTestItem, 'id'>

export async function getLabTestItems(
  labId: number,
  filter: TestItemFilter
): Promise<LabTestItem[]> {
  return fetchAll<LabTestItem>('lab_test_item', {
    lab_id: labId,
    standard_code: filter.standard || undefined,
    method: filter.method || undefined,
  })
}

export async function createLabTestItem(payload: LabTestItemPayload): Promise<LabTestItem> {
  return createRecord<LabTestItem>('lab_test_item', payload)
}

export async function updateLabTestItem(id: number, payload: LabTestItemPayload): Promise<LabTestItem> {
  return updateRecord<LabTestItem>('lab_test_item', id, payload)
}

export async function deleteLabTestItems(ids: number[]): Promise<void> {
  await deleteRecords('lab_test_item', ids)
}

export async function toggleLabTestItemStatus(
  id: number,
  status: EntityStatus
): Promise<LabTestItem> {
  return updateRecord<LabTestItem>('lab_test_item', id, { status })
}

// ---------- 操作日志 ----------

export async function getOperationLogs(): Promise<OperationLog[]> {
  return fetchAll<OperationLog>('operation_log')
}