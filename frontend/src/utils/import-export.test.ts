import { describe, expect, it } from 'vitest'
import type { Lab, LabTestItem, SampleType, TestPurpose } from '@/api/system'
import {
  LAB_HEADERS,
  SAMPLE_TYPE_HEADERS,
  TEST_ITEM_HEADERS,
  TEST_PURPOSE_HEADERS,
  idsToNames,
  labToRow,
  namesToIds,
  parseCsvToRows,
  parseLabRow,
  parseSampleTypeRow,
  parseStatus,
  parseTestItemRow,
  parseTestPurposeRow,
  sampleTypeToRow,
  splitNames,
  testItemToRow,
  testPurposeToRow,
} from './import-export'

describe('parseCsvToRows', () => {
  it('去掉 BOM 与表头，返回数据行', () => {
    expect(parseCsvToRows('\uFEFF名称,编码\nA,ST_1\nB,ST_2')).toEqual([
      ['A', 'ST_1'],
      ['B', 'ST_2'],
    ])
  })

  it('兼容 CRLF 与跳过空白行', () => {
    expect(parseCsvToRows('名称,编码\r\n\r\nA,ST_1\r\n')).toEqual([['A', 'ST_1']])
  })

  it('空文本或仅表头返回空数组', () => {
    expect(parseCsvToRows('')).toEqual([])
    expect(parseCsvToRows('\uFEFF名称,编码')).toEqual([])
  })

  it('保留引号包裹字段的内容', () => {
    expect(parseCsvToRows('名称,备注\n"a,b",c\n')).toEqual([['a,b', 'c']])
  })

  it('解析引号内的转义双引号（""）', () => {
    expect(parseCsvToRows('名称,备注\n"说 ""你好""",x\n')).toEqual([['说 "你好"', 'x']])
  })
})

describe('parseStatus', () => {
  it('仅 disabled 视为禁用', () => {
    expect(parseStatus('disabled')).toBe('disabled')
  })

  it('其余情况视为启用', () => {
    expect(parseStatus('enabled')).toBe('enabled')
    expect(parseStatus(undefined)).toBe('enabled')
    expect(parseStatus('')).toBe('enabled')
  })
})

describe('splitNames', () => {
  it('按多种分隔符拆分并去空', () => {
    expect(splitNames('金属材料、塑料材料,化工产品')).toEqual(['金属材料', '塑料材料', '化工产品'])
    expect(splitNames('A; B、C，D')).toEqual(['A', 'B', 'C', 'D'])
  })

  it('空值返回空数组', () => {
    expect(splitNames('  ')).toEqual([])
  })
})

describe('idsToNames / namesToIds', () => {
  const options = [
    { id: 1, name: '金属材料' },
    { id: 2, name: '塑料材料' },
  ]

  it('按 ID 映射名称并用顿号连接', () => {
    expect(idsToNames([1, 2], options)).toBe('金属材料、塑料材料')
  })

  it('跳过未匹配的 ID', () => {
    expect(idsToNames([1, 99], options)).toBe('金属材料')
  })

  it('按名称映射 ID', () => {
    expect(namesToIds('金属材料、塑料材料', options)).toEqual([1, 2])
  })

  it('跳过未匹配的名称', () => {
    expect(namesToIds('金属材料、未知', options)).toEqual([1])
  })
})

describe('基础数据导出行映射', () => {
  it('sampleTypeToRow 映射样品类型列', () => {
    expect(sampleTypeToRow({ name: '金属材料', code: 'ST_001', sort_order: 1, status: 'enabled', remark: '含合金' })).toEqual([
      '金属材料',
      'ST_001',
      1,
      'enabled',
      '含合金',
    ])
  })

  it('sampleTypeToRow 无备注补空串', () => {
    expect(sampleTypeToRow({ name: 'A', code: 'ST_1', sort_order: 0, status: 'disabled' })).toEqual([
      'A',
      'ST_1',
      0,
      'disabled',
      '',
    ])
  })

  it('testPurposeToRow 映射检测目的列（含分类）', () => {
    expect(
      testPurposeToRow({ name: '型式试验', code: 'TP_001', category: '型式检验', sort_order: 1, status: 'enabled', remark: '' })
    ).toEqual(['型式试验', 'TP_001', '型式检验', 1, 'enabled', ''])
  })
})

describe('基础数据导入行解析', () => {
  it('parseSampleTypeRow 解析字段', () => {
    expect(parseSampleTypeRow(['金属材料', 'ST_001', '3', 'enabled', '备注'])).toEqual({
      name: '金属材料',
      code: 'ST_001',
      sort_order: 3,
      remark: '备注',
    })
  })

  it('parseSampleTypeRow 去除名称空白并回填默认值', () => {
    expect(parseSampleTypeRow([' 金属材料 ', ''])).toEqual({
      name: '金属材料',
      code: '',
      sort_order: 0,
      remark: '',
    })
  })

  it('parseTestPurposeRow 解析分类/排序号/备注', () => {
    expect(parseTestPurposeRow(['型式试验', 'TP_001', '委托检验', '2', 'enabled', '备注'])).toEqual({
      name: '型式试验',
      code: 'TP_001',
      category: '委托检验',
      sort_order: 2,
      remark: '备注',
    })
  })
})

describe('实验室行映射', () => {
  const lab: Lab = {
    id: 1,
    name: '环境实验室',
    code: 'ENV',
    location: '一号楼',
    manager: '王工',
    contact_phone: '13800001001',
    status: 'enabled',
    max_capacity: 20,
    test_item_count: 4,
    remark: '备注',
  }

  it('labToRow 映射实验室列', () => {
    expect(labToRow(lab)).toEqual([
      '环境实验室',
      'ENV',
      '一号楼',
      '王工',
      '13800001001',
      'enabled',
      20,
      4,
      '备注',
    ])
  })

  it('parseLabRow 解析字段', () => {
    expect(parseLabRow(['环境实验室', 'ENV', '一号楼', '王工', '13800001001', 'enabled', '20', '4', '备注'])).toEqual({
      name: '环境实验室',
      code: 'ENV',
      location: '一号楼',
      manager: '王工',
      contact_phone: '13800001001',
      status: 'enabled',
      max_capacity: 20,
      remark: '备注',
    })
  })

  it('parseLabRow 缺省状态与最大项目数', () => {
    expect(parseLabRow(['环境实验室', '', '', '', ''])).toEqual({
      name: '环境实验室',
      code: '',
      location: '',
      manager: '',
      contact_phone: '',
      status: 'enabled',
      max_capacity: 20,
      remark: undefined,
    })
  })

  it('parseLabRow 禁用状态与非法容量回落默认', () => {
    expect(parseLabRow(['A', 'B', '', '', '', 'disabled', 'abc'])).toEqual({
      name: 'A',
      code: 'B',
      location: '',
      manager: '',
      contact_phone: '',
      status: 'disabled',
      max_capacity: 20,
      remark: undefined,
    })
  })
})

describe('测试项目行映射', () => {
  const sampleTypes: SampleType[] = [
    { id: 1, name: '金属材料', code: 'ST_001', sort_order: 1, status: 'enabled', created_at: '' },
    { id: 2, name: '塑料材料', code: 'ST_002', sort_order: 2, status: 'enabled', created_at: '' },
  ]
  const purposes: TestPurpose[] = [
    { id: 1, name: '型式试验', code: 'TP_001', category: '型式检验', sort_order: 1, status: 'enabled', created_at: '' },
    { id: 2, name: '委托试验', code: 'TP_002', category: '委托检验', sort_order: 2, status: 'enabled', created_at: '' },
  ]
  const item: LabTestItem = {
    id: 1,
    lab_id: 1,
    name: '高温试验',
    standard_code: 'GB/T 2423.2',
    method: '高温箱',
    equipment: '高温箱',
    duration: '2h',
    sample_type_ids: [1, 2],
    purpose_ids: [1],
    status: 'enabled',
  }

  it('testItemToRow 解析适用样品类型/检测目的名称', () => {
    expect(testItemToRow(item, sampleTypes, purposes)).toEqual([
      '高温试验',
      'GB/T 2423.2',
      '高温箱',
      '高温箱',
      '2h',
      '金属材料、塑料材料',
      '型式试验',
      'enabled',
    ])
  })

  it('parseTestItemRow 按名称反查 ID 并组装 payload', () => {
    expect(
      parseTestItemRow(['高温试验', 'GB/T 2423.2', '高温箱', '高温箱', '2h', '金属材料、塑料材料', '型式试验', 'enabled'], 5, sampleTypes, purposes)
    ).toEqual({
      lab_id: 5,
      name: '高温试验',
      standard_code: 'GB/T 2423.2',
      method: '高温箱',
      equipment: '高温箱',
      duration: '2h',
      sample_type_ids: [1, 2],
      purpose_ids: [1],
      status: 'enabled',
    })
  })
})

describe('导出列与表头对齐', () => {
  it('四个表头常量内容正确', () => {
    expect(SAMPLE_TYPE_HEADERS).toEqual(['名称', '编码', '排序号', '状态', '备注'])
    expect(TEST_PURPOSE_HEADERS).toEqual(['名称', '编码', '分类', '排序号', '状态', '备注'])
    expect(LAB_HEADERS).toEqual(['名称', '编码', '地址', '负责人', '联系电话', '状态', '最大项目数', '项目数', '备注'])
    expect(TEST_ITEM_HEADERS).toEqual(['项目名称', '标准编号', '检测方法', '所需设备', '预计耗时', '适用样品类型', '适用检测目的', '状态'])
  })

  it('每个导出行列数与对应表头一致', () => {
    const lab: Lab = {
      id: 1,
      name: 'L',
      code: 'C',
      location: '',
      manager: '',
      contact_phone: '',
      status: 'enabled',
      max_capacity: 1,
      test_item_count: 0,
    }
    const item: LabTestItem = {
      id: 1,
      lab_id: 1,
      name: 'I',
      standard_code: 'S',
      method: 'M',
      equipment: 'E',
      duration: '1h',
      sample_type_ids: [],
      purpose_ids: [],
      status: 'enabled',
    }

    expect(sampleTypeToRow({ name: 'A', code: 'B', sort_order: 0, status: 'enabled' })).toHaveLength(
      SAMPLE_TYPE_HEADERS.length
    )
    expect(testPurposeToRow({ name: 'A', code: 'B', sort_order: 0, status: 'enabled' })).toHaveLength(
      TEST_PURPOSE_HEADERS.length
    )
    expect(labToRow(lab)).toHaveLength(LAB_HEADERS.length)
    expect(testItemToRow(item, [], [])).toHaveLength(TEST_ITEM_HEADERS.length)
  })
})