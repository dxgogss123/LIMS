import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadCsv, parseCsvLine, toCsvCell } from './csv'

describe('toCsvCell', () => {
  it('普通值原样返回', () => {
    expect(toCsvCell('abc')).toBe('abc')
  })

  it('含逗号、引号或换行的值需加引号包裹', () => {
    expect(toCsvCell('a,b')).toBe('"a,b"')
    expect(toCsvCell('a\nb')).toBe('"a\nb"')
  })

  it('内部引号需转义为双引号', () => {
    expect(toCsvCell('say "hi"')).toBe('"say ""hi"""')
  })
})

describe('parseCsvLine', () => {
  it('按逗号拆分普通字段', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('保留引号内的逗号', () => {
    expect(parseCsvLine('"a,b",c')).toEqual(['a,b', 'c'])
  })

  it('解析转义引号（""）', () => {
    expect(parseCsvLine('"say ""hi""",x')).toEqual(['say "hi"', 'x'])
  })

  it('保留引号内的换行', () => {
    expect(parseCsvLine('"a\nb",c')).toEqual(['a\nb', 'c'])
  })

  it('处理空字段与空字符串', () => {
    expect(parseCsvLine('a,,c')).toEqual(['a', '', 'c'])
    expect(parseCsvLine('')).toEqual([''])
  })
})

describe('downloadCsv', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('生成带 BOM 的 CSV 并以指定文件名触发下载', async () => {
    let capturedBlob: Blob | null = null
    const click = vi.fn()
    const anchor = { href: '', download: '', click }
    const createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock'
    })
    const revokeObjectURL = vi.fn()

    vi.stubGlobal('document', { createElement: vi.fn().mockReturnValue(anchor) })
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    downloadCsv('测试.csv', ['名称', '编码'], [['样品A', 'ST_1']])

    expect(anchor.download).toBe('测试.csv')
    expect(anchor.href).toBe('blob:mock')
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')

    // 文件内容以 UTF-8 BOM（EF BB BF）开头
    const bytes = new Uint8Array(await (capturedBlob as unknown as Blob).arrayBuffer())
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf])
    const body = new TextDecoder().decode(bytes.subarray(3))
    expect(body).toBe('名称,编码\r\n样品A,ST_1')
  })
})