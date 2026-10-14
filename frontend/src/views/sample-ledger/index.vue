<template>
  <div class="sample-page">
    <!-- 搜索卡片 -->
    <el-card shadow="never" class="search-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">信息查询</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>
        </div>
      </template>

      <el-form :model="searchForm" label-position="top" class="search-form">
        <el-form-item label="试验编码">
          <el-input v-model="searchForm.test_code" placeholder="请输入试验编码" clearable />
        </el-form-item>
        <el-form-item label="委托人">
          <el-input v-model="searchForm.client" placeholder="请输入委托人" clearable />
        </el-form-item>
        <el-form-item label="区域">
          <el-select v-model="searchForm.area" placeholder="请选择区域" clearable>
            <el-option v-for="o in AREA_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="实验室">
          <el-select v-model="searchForm.lab" placeholder="请选择实验室" clearable>
            <el-option v-for="o in LAB_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="入库时间">
          <el-date-picker
            v-model="searchForm.receive_time"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="样机型号">
          <el-input v-model="searchForm.sample_model" placeholder="请输入样机型号" clearable />
        </el-form-item>

        </el-form>
    </el-card>

    <!-- 操作栏 + 表格 + 分页 -->
    <el-card shadow="never" class="table-card">
      <div class="op-bar">
        <el-button type="primary" :icon="Plus" @click="openCreate">样机入库</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>

        <div class="op-bar-right">
          <el-dropdown trigger="click">
            <el-button>
              订制表格
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="c in COLUMN_OPTIONS" :key="c">{{ c }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column type="selection" width="50" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="sample_no" label="样机编码" width="140" fixed="left" />
        <el-table-column prop="name" label="样机名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="spec" label="外观型号" width="120" />
        <el-table-column prop="project_no" label="所属委托单" width="160" show-overflow-tooltip />
        <el-table-column prop="location" label="当前位置" width="120" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="STATUS_TAG_TYPE[row.status as SampleStatus]">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receive_date" label="接收日期" width="110" />
        <el-table-column prop="dispose_date" label="处置日期" width="110" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openView(row)">查看</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openRecord(row)">流转记录</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-text">共有 {{ total }} 条数据</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadList"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '样机入库' : '编辑样机'"
      width="60%"
      top="8vh"
      destroy-on-close
    >
      <el-form :model="form" label-width="90px">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="样机编码">
              <el-input
                v-model="form.sample_no"
                :disabled="dialogMode === 'edit'"
                placeholder="请输入样机编码"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="样机名称" required>
              <el-input v-model="form.name" placeholder="请输入样机名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="外观型号">
              <el-input v-model="form.spec" placeholder="请输入外观型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属委托单" required>
              <el-select
                v-model="form.project_no"
                filterable
                remote
                :remote-method="remoteSearchProject"
                placeholder="请输入/选择委托单"
                style="width: 100%"
              >
                <el-option v-for="o in projectOptions" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="样机批次">
              <el-input v-model="form.batch" placeholder="请输入样机批次" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放区域">
              <el-select v-model="form.storage_area" placeholder="请选择存放区域" style="width: 100%">
                <el-option v-for="o in STORAGE_AREA_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前位置">
              <el-input v-model="form.location" placeholder="请输入当前位置" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" required>
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option v-for="o in SAMPLE_STATUSES" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库时间">
              <el-date-picker
                v-model="form.receive_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择入库时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 样机入库对话框 -->
    <el-dialog v-model="entryVisible" title="样机入库" width="720px" top="6vh" destroy-on-close>
      <div class="entry-top">
        <el-input v-model="entryForm.test_code" placeholder="请输入试验编码" clearable style="width: 240px" />
        <el-button type="primary" :loading="extracting" @click="handleExtract">提取</el-button>
        <el-button type="primary" @click="addSample">新增样机</el-button>
      </div>

      <div v-for="(s, i) in entryForm.samples" :key="i" class="entry-card">
        <div class="entry-card__header">
          <span>第{{ i + 1 }}套样机</span>
          <el-button link type="danger" @click="removeSample(i)">删除</el-button>
        </div>
        <el-form label-width="90px">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="样机类型" :required="true">
                <el-radio-group v-model="s.machine_type">
                  <el-radio :value="'整机'">整机</el-radio>
                  <el-radio :value="'内机'">内机</el-radio>
                  <el-radio :value="'外机'">外机</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="样机名称" :required="true">
                <el-input v-model="s.name" placeholder="请输入样机名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="样机型号" :required="true">
                <el-input v-model="s.model" placeholder="请输入样机型号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="可选实验室" :required="true">
                <el-select
                  v-model="s.lab_id"
                  placeholder="请选择可选实验室"
                  clearable
                  filterable
                  style="width: 100%"
                >
                  <el-option v-for="l in entryLabs" :key="l.id" :label="l.name" :value="l.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目编码" :required="true">
                <el-input v-model="s.project_code" placeholder="请输入项目编码" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="试验编码" :required="true">
                <el-input v-model="s.test_code" placeholder="请输入试验编码" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="委托人" :required="true">
                <el-select
                  v-model="s.client_id"
                  filterable
                  remote
                  :remote-method="searchClients"
                  :loading="clientLoading"
                  placeholder="请选择"
                  clearable
                  style="width: 100%"
                >
                  <el-option v-for="c in clientOptions" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input v-model="s.remark" type="textarea" :rows="2" placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="entryVisible = false">取消</el-button>
        <el-button type="primary" :loading="entrySaving" @click="handleEntrySubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 流转记录对话框 -->
    <el-dialog v-model="recordVisible" title="流转记录" width="70%" top="8vh" destroy-on-close>
      <el-table :data="flowRecords" border size="small">
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column prop="action" label="操作类型" width="110" />
        <el-table-column prop="from_status" label="操作前状态" width="120" />
        <el-table-column prop="to_status" label="操作后状态" width="120" />
        <el-table-column prop="operator" label="操作人" width="110" />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, Download, Plus, Search } from '@element-plus/icons-vue'
import type { SampleFlowRecord, SampleItem, SampleStatus } from '@/api/sample-ledger'
import {
  SAMPLE_STATUSES,
  createSample,
  getSampleFlows,
  getSampleList,
  updateSample,
} from '@/api/sample-ledger'
import type { ClientItem } from '@/api/client'
import { getClientList } from '@/api/client'
import {
  createSampleEntry,
  extractByTestCode,
  fetchEntryLabs,
  type EntryLabOption,
  type SampleEntryForm,
  type SampleEntryItem,
} from '@/api/inventory'

type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

const STATUS_TAG_TYPE: Record<SampleStatus, TagType> = {
  在库: 'success',
  在测: 'warning',
  已测完: 'info',
  已处置: 'danger',
  报废: 'danger',
}

// 搜索条件选项
const AREA_OPTIONS = ['A区', 'B区', 'C区', '留样室', '处置区']
const LAB_OPTIONS = ['理化室', '电气室', '环境室', 'EMC室']
// 后期对接：存放区域 / 订制表格列 选项
const STORAGE_AREA_OPTIONS: string[] = []
const COLUMN_OPTIONS: string[] = []

interface SearchForm {
  test_code: string
  client: string
  area: string
  lab: string
  receive_time: string[]
  sample_model: string
}

interface SampleForm {
  id: number | null
  sample_no: string
  name: string
  spec: string
  project_no: string
  batch: string
  storage_area: string
  location: string
  status: SampleStatus | ''
  receive_date: string
  remark: string
}

const list = ref<SampleItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const searchForm = reactive<SearchForm>(emptySearchForm())

const dialogVisible = ref(false)
const saving = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const form = reactive<SampleForm>(emptySampleForm())

const recordVisible = ref(false)
const flowRecords = ref<SampleFlowRecord[]>([])
const projectOptions = ref<string[]>([])

function emptySearchForm(): SearchForm {
  return {
    test_code: '',
    client: '',
    area: '',
    lab: '',
    receive_time: [],
    sample_model: '',
  }
}

function todayStr(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function emptySampleForm(): SampleForm {
  return {
    id: null,
    sample_no: '',
    name: '',
    spec: '',
    project_no: '',
    batch: '',
    storage_area: '',
    location: '',
    status: '',
    receive_date: todayStr(),
    remark: '',
  }
}

async function loadList() {
  loading.value = true
  try {
    const result = await getSampleList({
      page: page.value,
      page_size: pageSize.value,
    })
    list.value = result.items
    total.value = result.total
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadList()
}

function handleReset() {
  Object.assign(searchForm, emptySearchForm())
  page.value = 1
  loadList()
}

function handleSizeChange() {
  page.value = 1
  loadList()
}

function openCreate() {
  entryForm.test_code = ''
  entryForm.samples = [emptySampleCard()]
  entryVisible.value = true
}

function openEdit(row: SampleItem) {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    sample_no: row.sample_no,
    name: row.name,
    spec: row.spec,
    project_no: row.project_no,
    batch: row.batch,
    storage_area: row.storage_area,
    location: row.location,
    status: row.status,
    receive_date: row.receive_date,
    remark: row.remark,
  })
  dialogVisible.value = true
}

function openView(row: SampleItem) {
  ElMessage.info(`查看样机「${row.name}」（功能待开发）`)
}

async function openRecord(row: SampleItem) {
  flowRecords.value = await getSampleFlows(row.sample_no)
  recordVisible.value = true
}

function handleExport() {
  ElMessage.success('导出成功（当前为 mock 数据）')
}

// 后期对接委托单列表接口
function remoteSearchProject(_query: string) {
  projectOptions.value = []
}

// ---------- 样机入库 ----------

const entryVisible = ref(false)
const entrySaving = ref(false)
const extracting = ref(false)

const entryLabs = ref<EntryLabOption[]>([])
const clientOptions = ref<ClientItem[]>([])
const clientLoading = ref(false)

const entryForm = reactive<SampleEntryForm>({
  test_code: '',
  samples: [emptySampleCard()],
})

function emptySampleCard(): SampleEntryItem {
  return {
    machine_type: '整机',
    name: '',
    model: '',
    lab_id: null,
    project_code: '',
    test_code: '',
    client_id: null,
    remark: '',
  }
}

function addSample() {
  entryForm.samples.push(emptySampleCard())
}

function removeSample(index: number) {
  entryForm.samples.splice(index, 1)
}

function searchClients(keyword: string) {
  clientLoading.value = true
  getClientList({ page: 1, page_size: 20, keyword })
    .then((res) => {
      clientOptions.value = res.items
    })
    .finally(() => {
      clientLoading.value = false
    })
}

async function handleExtract() {
  const code = entryForm.test_code.trim()
  if (!code) {
    ElMessage.warning('请输入试验编码')
    return
  }
  extracting.value = true
  try {
    const list = await extractByTestCode(code)
    if (list && list.length) {
      entryForm.samples = list.map((s) => ({ ...emptySampleCard(), ...s }))
      ElMessage.success('提取成功')
    } else {
      ElMessage.warning('未找到对应试验数据')
    }
  } finally {
    extracting.value = false
  }
}

async function handleEntrySubmit() {
  const samples = entryForm.samples
  if (samples.length === 0) {
    ElMessage.warning('请至少添加一套样机')
    return
  }
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]
    if (!s.name) {
      ElMessage.warning(`第 ${i + 1} 套样机：请输入样机名称`)
      return
    }
    if (!s.model) {
      ElMessage.warning(`第 ${i + 1} 套样机：请输入样机型号`)
      return
    }
    if (s.lab_id == null) {
      ElMessage.warning(`第 ${i + 1} 套样机：请选择可选实验室`)
      return
    }
    if (!s.project_code) {
      ElMessage.warning(`第 ${i + 1} 套样机：请输入项目编码`)
      return
    }
    if (!s.test_code) {
      ElMessage.warning(`第 ${i + 1} 套样机：请输入试验编码`)
      return
    }
    if (s.client_id == null) {
      ElMessage.warning(`第 ${i + 1} 套样机：请选择委托人`)
      return
    }
  }
  entrySaving.value = true
  try {
    await createSampleEntry({
      test_code: entryForm.test_code,
      samples: entryForm.samples,
    })
    ElMessage.success('入库成功')
    entryVisible.value = false
    loadList()
  } finally {
    entrySaving.value = false
  }
}

async function handleSubmit() {
  if (!form.sample_no || !form.name || !form.project_no || !form.status) {
    ElMessage.warning('请填写样机编码、样机名称、所属委托单和状态')
    return
  }
  saving.value = true
  try {
    const payload: Partial<SampleItem> = {
      sample_no: form.sample_no,
      name: form.name,
      spec: form.spec,
      project_no: form.project_no,
      batch: form.batch,
      storage_area: form.storage_area,
      location: form.location,
      status: form.status as SampleStatus,
      receive_date: form.receive_date,
      remark: form.remark,
    }
    if (dialogMode.value === 'edit' && form.id) {
      await updateSample(form.id, payload)
    } else {
      await createSample(payload)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadList()
  fetchEntryLabs().then((list) => {
    entryLabs.value = list
  })
})
</script>

<style scoped>
.sample-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  position: relative;
  padding-left: 11px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  background: #409eff;
  border-radius: 2px;
}

.search-card :deep(.el-card__header) {
  padding: 12px 16px;
}

.search-card :deep(.el-card__body) {
  padding: 16px 16px 12px;
}

.search-form {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0 12px;
  margin-bottom: 0;
}

.search-form :deep(.el-form-item) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
  margin-right: 0;
  margin-bottom: 0;
}

.search-form :deep(.el-form-item__label) {
  display: block;
  width: auto;
  font-size: 14px;
  color: #606266;
  line-height: 22px;
  text-align: left;
  margin-bottom: 4px;
}

.search-form :deep(.el-form-item__label::after) {
  content: '';
  margin: 0;
}

.search-form :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
  margin-left: 0;
}

.search-form :deep(.el-input),
.search-form :deep(.el-select),
.search-form :deep(.el-date-editor) {
  width: 100%;
}

.search-form :deep(.el-input__wrapper),
.search-form :deep(.el-select__wrapper) {
  height: 32px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.op-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.op-bar-right {
  margin-left: auto;
}

.entry-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.entry-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.entry-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
  color: #303133;
}

.entry-card :deep(.el-form-item__label) {
  white-space: nowrap;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.total-text {
  font-size: 13px;
  color: #909399;
}
</style>