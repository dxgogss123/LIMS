// 导入导出纯函数：将 CSV 解析与行映射逻辑从页面中抽取，便于复用与单元测试。
import { parseCsvLine } from '@/utils/csv'
import type {
  EntityStatus,
  Lab,
  LabPayload,
  LabTestItem,
  LabTestItemPayload,
  SampleType,
  SampleTypePayload,
  TestPurpose,
  TestPurposePayload,
} from '@/api/system'

// ---------- 通用 ----------

/** 将状态文本归一化为状态枚举：仅 'disabled' 视为禁用，其余视为启用 */
export function parseStatus(text: string | undefined): EntityStatus {
  return text === 'disabled' ? 'disabled' : 'enabled'
}

/** 按顿号 / 逗号（中英文）/ 分号 / 空白拆分名称列表 */
export function splitNames(names: string): string[] {
  return names
    .split(/[、,，;；\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 将 ID 列表映射为名称，用顿号连接（跳过未匹配项） */
export function idsToNames(ids: number[], options: { id: number; name: string }[]): string {
  return ids
    .map((id) => options.find((o) => o.id === id)?.name ?? '')
    .filter(Boolean)
    .join('、')
}

/** 将名称列表映射为 ID（跳过未匹配项） */
export function namesToIds(names: string, options: { id: number; name: string }[]): number[] {
  return splitNames(names)
    .map((n) => options.find((o) => o.name === n)?.id)
    .filter((id): id is number => id !== undefined)
}

/** 解析 CSV 文本（去掉 BOM 与表头行），返回数据行的单元格数组；无数据行时返回空数组 */
export function parseCsvToRows(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  return lines.slice(1).map(parseCsvLine)
}

// ---------- 基础数据 ----------

export const SAMPLE_TYPE_HEADERS = ['名称', '编码', '排序号', '状态', '备注']
export const TEST_PURPOSE_HEADERS = ['名称', '编码', '分类', '排序号', '状态', '备注']

export function sampleTypeToRow(item: {
  name: string
  code: string
  sort_order: number
  status: EntityStatus
  remark?: string
}): (string | number)[] {
  return [item.name, item.code, item.sort_order, item.status, item.remark ?? '']
}

export function testPurposeToRow(item: {
  name: string
  code: string
  category?: string
  sort_order: number
  status: EntityStatus
  remark?: string
}): (string | number)[] {
  return [item.name, item.code, item.category ?? '', item.sort_order, item.status, item.remark ?? '']
}

export function parseSampleTypeRow(cells: string[]): SampleTypePayload {
  return {
    name: (cells[0] ?? '').trim(),
    code: (cells[1] ?? '').trim(),
    sort_order: Number.parseInt(cells[2] ?? '0', 10) || 0,
    remark: cells[cells.length - 1] ?? '',
  }
}

export function parseTestPurposeRow(cells: string[]): TestPurposePayload {
  return {
    name: (cells[0] ?? '').trim(),
    code: (cells[1] ?? '').trim(),
    category: cells[2] ?? '委托检验',
    sort_order: Number.parseInt(cells[3] ?? '0', 10) || 0,
    remark: cells[cells.length - 1] ?? '',
  }
}

// ---------- 实验室 ----------

export const LAB_HEADERS = ['名称', '编码', '地址', '负责人', '联系电话', '状态', '最大项目数', '项目数', '备注']

export function labToRow(lab: Lab): (string | number)[] {
  return [
    lab.name,
    lab.code,
    lab.location,
    lab.manager,
    lab.contact_phone,
    lab.status,
    lab.max_capacity,
    lab.test_item_count,
    lab.remark ?? '',
  ]
}

export function parseLabRow(cells: string[]): LabPayload {
  return {
    name: (cells[0] ?? '').trim(),
    code: (cells[1] ?? '').trim(),
    location: cells[2] ?? '',
    manager: cells[3] ?? '',
    contact_phone: cells[4] ?? '',
    status: parseStatus(cells[5]),
    max_capacity: Number.parseInt(cells[6] ?? '20', 10) || 20,
    remark: cells[8]?.trim() || undefined,
  }
}

// ---------- 测试项目 ----------

export const TEST_ITEM_HEADERS = ['项目名称', '标准编号', '检测方法', '所需设备', '预计耗时', '适用样品类型', '适用检测目的', '状态']

export function testItemToRow(
  item: LabTestItem,
  sampleTypes: SampleType[],
  testPurposes: TestPurpose[]
): (string | number)[] {
  return [
    item.name,
    item.standard_code,
    item.method,
    item.equipment,
    item.duration,
    idsToNames(item.sample_type_ids, sampleTypes),
    idsToNames(item.purpose_ids, testPurposes),
    item.status,
  ]
}

export function parseTestItemRow(
  cells: string[],
  labId: number,
  sampleTypes: SampleType[],
  testPurposes: TestPurpose[]
): LabTestItemPayload {
  return {
    lab_id: labId,
    name: (cells[0] ?? '').trim(),
    standard_code: cells[1] ?? '',
    method: cells[2] ?? '',
    equipment: cells[3] ?? '',
    duration: cells[4] ?? '',
    sample_type_ids: namesToIds(cells[5] ?? '', sampleTypes),
    purpose_ids: namesToIds(cells[6] ?? '', testPurposes),
    status: parseStatus(cells[7]),
  }
}