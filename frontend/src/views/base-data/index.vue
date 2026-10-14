<template>
  <div class="base-data-page">
    <el-card>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="样品类型" name="sample" />
        <el-tab-pane label="检测目的" name="purpose" />
      </el-tabs>

      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="按名称搜索"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button v-if="userStore.canManage" type="primary" :icon="Plus" @click="openCreate">
          新增
        </el-button>
        <el-button v-if="userStore.canManage" :icon="Upload" @click="triggerImport">导入</el-button>
        <el-button :icon="Download" @click="handleExport">导出Excel</el-button>
        <el-button
          v-if="userStore.canManage"
          type="danger"
          :icon="Delete"
          :disabled="!selection.length"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <input
          ref="importInputRef"
          type="file"
          accept=".csv"
          style="display: none"
          @change="handleImportFile"
        />
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        stripe
        :row-class-name="rowClassName"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column v-if="userStore.canManage" type="selection" width="50" />
        <el-table-column label="名称" prop="name" min-width="160" sortable="custom" show-overflow-tooltip />
        <el-table-column label="编码" prop="code" width="170" />
        <el-table-column v-if="activeTab === 'purpose'" label="分类" prop="category" width="120" />
        <el-table-column label="排序号" prop="sort_order" width="100" sortable="custom" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status"
              active-value="enabled"
              inactive-value="disabled"
              @change="(val: string | number | boolean) => handleToggleStatus(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="created_at" width="180" show-overflow-tooltip />
        <el-table-column v-if="userStore.canManage" label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无数据，点击「新增」创建第一条数据" :image-size="80" />
        </template>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.page_size"
        class="pagination"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadList"
        @size-change="loadList"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑' : '新增'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <div class="code-row">
            <el-input v-model="form.code" placeholder="请输入编码" />
            <el-button @click="regenerateCode">生成编码</el-button>
          </div>
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sort_order" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Download, Plus, Search, Upload } from '@element-plus/icons-vue'
import { downloadCsv } from '@/utils/csv'
import {
  SAMPLE_TYPE_HEADERS,
  TEST_PURPOSE_HEADERS,
  parseCsvToRows,
  parseSampleTypeRow,
  parseTestPurposeRow,
  sampleTypeToRow,
  testPurposeToRow,
} from '@/utils/import-export'
import type { EntityStatus, ListResult } from '@/api/system'
import {
  checkSampleTypeCodeUnique,
  checkSampleTypeNameUnique,
  checkTestPurposeCodeUnique,
  checkTestPurposeNameUnique,
  createSampleType,
  createTestPurpose,
  deleteSampleTypes,
  deleteTestPurposes,
  genSampleTypeCode,
  genTestPurposeCode,
  getSampleTypeList,
  getTestPurposeList,
  toggleSampleTypeStatus,
  toggleTestPurposeStatus,
  updateSampleType,
  updateTestPurpose,
} from '@/api/system'
import { useUserStore } from '@/stores/modules/user'

type ActiveTab = 'sample' | 'purpose'

interface Row {
  id: number
  name: string
  code: string
  category?: string
  sort_order: number
  status: EntityStatus
  created_at: string
  remark?: string
}

interface BaseDataForm {
  id: number | null
  name: string
  code: string
  category: string
  sort_order: number
  remark: string
}

const userStore = useUserStore()

const activeTab = ref<ActiveTab>('sample')
const list = ref<Row[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const importInputRef = ref<HTMLInputElement>()

const query = reactive({ page: 1, page_size: 10, keyword: '' })
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')
const selection = ref<Row[]>([])

const emptyForm = (): BaseDataForm => ({
  id: null,
  name: '',
  code: '',
  category: '',
  sort_order: 0,
  remark: '',
})

const form = reactive<BaseDataForm>(emptyForm())

const rules = computed<FormRules<BaseDataForm>>(() => {
  const isSample = activeTab.value === 'sample'
  return {
    name: [
      { required: true, message: '请输入名称', trigger: 'blur' },
      {
        validator: (_rule: unknown, value: string, callback: (error?: string | Error) => void) => {
          if (!value) return callback()
          const unique = isSample
            ? checkSampleTypeNameUnique(value, form.id ?? undefined)
            : checkTestPurposeNameUnique(value, form.id ?? undefined)
          if (unique) callback()
          else callback(new Error('名称已存在'))
        },
        trigger: 'blur',
      },
    ],
    code: [
      {
        validator: (_rule: unknown, value: string, callback: (error?: string | Error) => void) => {
          if (!value) return callback()
          if (!(isSample ? /^ST_\d+$/ : /^TP_\d+$/).test(value)) {
            return callback(new Error('编码格式需为前缀+数字'))
          }
          const unique = isSample
            ? checkSampleTypeCodeUnique(value, form.id ?? undefined)
            : checkTestPurposeCodeUnique(value, form.id ?? undefined)
          if (unique) callback()
          else callback(new Error('编码已存在'))
        },
        trigger: 'blur',
      },
    ],
  }
})

function rowClassName({ row }: { row: Row }): string {
  return row.status === 'disabled' ? 'disabled-row' : ''
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: query.page,
      page_size: query.page_size,
      keyword: query.keyword || undefined,
      sort_by: sortBy.value || undefined,
      order: sortOrder.value,
    }
    const result: ListResult<Row> =
      activeTab.value === 'sample'
        ? await getSampleTypeList(params)
        : await getTestPurposeList(params)
    list.value = result.items
    total.value = result.total
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadList()
}

function handleTabChange() {
  query.page = 1
  query.keyword = ''
  sortBy.value = ''
  sortOrder.value = 'asc'
  selection.value = []
  formRef.value?.clearValidate()
  loadList()
}

function handleSelectionChange(rows: Row[]) {
  selection.value = rows
}

function handleSortChange({ prop, order }: { prop: string; order: string | null }) {
  if (!order) {
    sortBy.value = ''
    sortOrder.value = 'asc'
  } else {
    sortBy.value = prop
    sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  }
  loadList()
}

function regenerateCode() {
  form.code = activeTab.value === 'sample' ? genSampleTypeCode() : genTestPurposeCode()
}

function openCreate() {
  Object.assign(form, emptyForm())
  form.code = activeTab.value === 'sample' ? genSampleTypeCode() : genTestPurposeCode()
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

function openEdit(row: Row) {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category ?? '',
    sort_order: row.sort_order,
    remark: row.remark ?? '',
  })
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  const payload = {
    name: form.name,
    code: form.code,
    sort_order: form.sort_order,
    remark: form.remark || undefined,
  }
  try {
    if (activeTab.value === 'sample') {
      if (form.id) {
        await updateSampleType(form.id, payload)
      } else {
        await createSampleType(payload)
      }
    } else {
      const purposePayload = { ...payload, category: form.category }
      if (form.id) {
        await updateTestPurpose(form.id, purposePayload)
      } else {
        await createTestPurpose(purposePayload)
      }
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleToggleStatus(row: Row, val: string | number | boolean) {
  const next = val as EntityStatus
  try {
    if (activeTab.value === 'sample') {
      await toggleSampleTypeStatus(row.id, next)
    } else {
      await toggleTestPurposeStatus(row.id, next)
    }
    row.status = next
    ElMessage.success(next === 'enabled' ? '已启用' : '已禁用')
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleDelete(row: Row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await removeRows([row.id])
    ElMessage.success('删除成功')
    loadList()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function handleBatchDelete() {
  if (!selection.value.length) {
    ElMessage.warning('请至少选择一项数据')
    return
  }
  const names = selection.value.map((it) => it.name)
  try {
    await ElMessageBox.confirm(
      `确定删除以下 ${names.length} 项数据吗？\n${names.join('、')}`,
      '批量删除',
      { type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await removeRows(selection.value.map((it) => it.id))
    ElMessage.success('删除成功')
    loadList()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function removeRows(ids: number[]) {
  if (activeTab.value === 'sample') {
    await deleteSampleTypes(ids)
  } else {
    await deleteTestPurposes(ids)
  }
}

// ---------- 导入导出 ----------

async function fetchFullRows(): Promise<Row[]> {
  const params = {
    page: 1,
    page_size: 100000,
    keyword: query.keyword || undefined,
    sort_by: sortBy.value || undefined,
    order: sortOrder.value,
  }
  const result =
    activeTab.value === 'sample'
      ? await getSampleTypeList(params)
      : await getTestPurposeList(params)
  return result.items
}

async function handleExport() {
  try {
    const rows = await fetchFullRows()
    if (activeTab.value === 'sample') {
      downloadCsv('样品类型.csv', SAMPLE_TYPE_HEADERS, rows.map((it) => sampleTypeToRow(it)))
    } else {
      downloadCsv('检测目的.csv', TEST_PURPOSE_HEADERS, rows.map((it) => testPurposeToRow(it)))
    }
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

function triggerImport() {
  importInputRef.value?.click()
}

async function handleImportFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const rows = parseCsvToRows(await file.text())
    if (!rows.length) {
      ElMessage.warning('文件内容为空')
      return
    }
    let count = 0
    for (const cells of rows) {
      if (activeTab.value === 'sample') {
        const row = parseSampleTypeRow(cells)
        if (!row.name) continue
        await createSampleType({ ...row, code: row.code || genSampleTypeCode() })
      } else {
        const row = parseTestPurposeRow(cells)
        if (!row.name) continue
        await createTestPurpose({ ...row, code: row.code || genTestPurposeCode() })
      }
      count++
    }
    ElMessage.success(`导入成功，共 ${count} 条`)
    loadList()
  } catch {
    ElMessage.error('导入失败，请检查文件格式')
  } finally {
    input.value = ''
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.code-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.code-row .el-input {
  flex: 1;
}

:deep(.el-table .disabled-row) {
  color: #c0c4cc;
  --el-table-tr-text-color: #c0c4cc;
}
</style>