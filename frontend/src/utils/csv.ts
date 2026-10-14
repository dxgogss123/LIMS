// 通用 CSV 工具：导出下载与导入解析（供基础数据 / 实验室管理等页面复用）。

/** 将单个单元格转义为 CSV 安全格式 */
export function toCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** 解析一行 CSV（支持引号包裹与逗号/换行转义） */
export function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}

/** 生成 CSV 文件（带 BOM）并触发浏览器下载 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const body = [headers, ...rows]
    .map((cells) => cells.map((c) => toCsvCell(String(c ?? ''))).join(','))
    .join('\r\n')
  const blob = new Blob(['\uFEFF' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}