// 样机入库接口封装（inventoryApi）。
// 可选实验室数据复用 systemApi；本模块负责入库表单类型、试验编码提取与提交接口。

import { getClientList } from './client'
import { getEntrustList } from './entrust'
import { getLabList } from './system'
import { createSample } from './sample-ledger'

export type MachineType = '整机' | '内机' | '外机'

export interface SampleEntryItem {
  machine_type: MachineType
  name: string
  model: string
  lab_id: number | null
  project_code: string
  test_code: string
  client_id: number | null
  remark: string
}

export interface SampleEntryForm {
  test_code: string
  samples: SampleEntryItem[]
}

export interface SampleEntryPayload {
  test_code: string
  samples: SampleEntryItem[]
}

export interface EntryLabOption {
  id: number
  name: string
}

export function fetchEntryLabs(): Promise<EntryLabOption[]> {
  return getLabList().then((labs) =>
    labs.filter((l) => l.status === 'enabled').map((l) => ({ id: l.id, name: l.name }))
  )
}

// 根据试验编码从委托数据中提取样机信息，实现与「委托管理」的深度联动
export async function extractByTestCode(
  testCode: string
): Promise<SampleEntryItem[] | null> {
  const code = testCode.trim()
  if (!code) return null

  const [entrustRes, labs, clients] = await Promise.all([
    getEntrustList({ page: 1, page_size: 1, test_code: code }),
    getLabList(),
    getClientList({ page: 1, page_size: 100 }),
  ])

  const item = entrustRes.items.find((it) => it.test_code === code)
  if (!item) return null

  const enabledLabs = labs.filter((l) => l.status === 'enabled')
  const labId =
    enabledLabs.find((l) => l.name === item.lab)?.id ?? enabledLabs[0]?.id ?? null
  const clientId = clients.items.find((c) => c.name === item.client)?.id ?? null

  const base = {
    lab_id: labId,
    project_code: '',
    test_code: '',
    client_id: clientId,
    remark: '',
  }

  // 整机卡片：取自委托单的样机名称 / 型号
  return [
    { machine_type: '整机', name: item.sample_name, model: item.sample_model, ...base },
  ]
}

function todayStr(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function genSampleNo(offset: number): string {
  return `SY-${Date.now()}-${offset}`
}

// 入库：按每套样机写入样机台账（sample_ledger），使入库数据在台账列表可见并持久化。
export async function createSampleEntry(payload: SampleEntryPayload): Promise<{ id: number }> {
  const results = await Promise.all(
    payload.samples.map((s, i) =>
      createSample({
        sample_no: genSampleNo(i),
        name: s.name,
        spec: s.model,
        project_no: s.project_code,
        status: '在库',
        receive_date: todayStr(),
        test_purpose: s.test_code,
        remark: s.remark,
      })
    )
  )
  return { id: results[0]?.id ?? 0 }
}