<template>
  <div class="sample-page">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <div class="search-grid">
        <div class="field">
          <span class="label">样机编码</span>
          <el-input v-model="searchForm.sample_no" placeholder="请输入" clearable />
        </div>
        <div class="field">
          <span class="label">样机名称/型号</span>
          <el-input v-model="searchForm.keyword" placeholder="请输入" clearable />
        </div>
        <div class="field">
          <span class="label">所属委托单号</span>
          <el-input v-model="searchForm.project_no" placeholder="请输入" clearable />
        </div>
        <div class="field">
          <span class="label">当前状态</span>
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option v-for="o in SAMPLE_STATUSES" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
      </div>

      <div class="search-actions">
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 操作栏 + 表格 + 分页 -->
    <el-card shadow="never" class="table-card">
      <div class="op-bar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增样机</el-button>
        <el-button :icon="Upload" @click="handleImport">批量导入</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column type="selection" width="50" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="sample_no" label="样机编码" width="150" />
        <el-table-column prop="name" label="样机名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="spec" label="外观型号" width="110" />
        <el-table-column prop="project_no" label="所属委托单" width="150" />
        <el-table-column prop="location" label="当前位置" min-width="130" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receive_date" label="接收日期" width="120" />
        <el-table-column prop="dispose_date" label="处置日期" width="120" />
        <el-table-column label="操作" width="160" fixed="right">
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
          layout="sizes, prev, pager, next, jumper"
          @current-change="loadList"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增样机' : '编辑样机'"
      width="560px"
      top="8vh"
      destroy-on-close
    >
      <el-row :gutter="24">
        <el-col :span="12">
          <div class="field">
            <span class="label">样机编码</span>
            <el-input v-model="form.sample_no" placeholder="请输入" />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="field">
            <span class="label">样机名称</span>
            <el-input v-model="form.name" placeholder="请输入" />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="field">
            <span class="label">外观型号</span>
            <el-input v-model="form.spec" placeholder="请输入" />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="field">
            <span class="label">所属委托单</span>
            <el-select v-model="form.project_no" placeholder="请选择">
              <el-option v-for="o in PROJECT_OPTIONS" :key="o" :label="o" :value="o" />
            </el-select>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="field">
            <span class="label">当前位置</span>
            <el-input v-model="form.location" placeholder="请输入" />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="field">
            <span class="label">状态</span>
            <el-select v-model="form.status">
              <el-option v-for="o in SAMPLE_STATUSES" :key="o" :label="o" :value="o" />
            </el-select>
          </div>
        </el-col>
      </el-row>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Plus, Refresh, Search, Upload } from '@element-plus/icons-vue'
import type { SampleItem, SampleStatus } from '@/api/sample-ledger'
import { SAMPLE_STATUSES, createSample, getSampleList } from '@/api/sample-ledger'

type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

const STATUS_TAG_TYPE: Record<SampleStatus, TagType> = {
  在库: 'info',
  在测: 'primary',
  已测完: 'success',
  已处置: 'warning',
  报废: 'danger',
}

const PROJECT_OPTIONS = ['LAB2026-0001', 'LAB2026-0002', 'LAB2026-0003', 'LAB2026-0004']

interface SearchForm {
  sample_no: string
  keyword: string
  project_no: string
  status: string
}

interface SampleForm {
  id: number | null
  sample_no: string
  name: string
  spec: string
  project_no: string
  location: string
  status: SampleStatus
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

function statusMeta(status: string): { type: TagType } {
  return { type: STATUS_TAG_TYPE[status as SampleStatus] || 'info' }
}

function emptySearchForm(): SearchForm {
  return { sample_no: '', keyword: '', project_no: '', status: '' }
}

function emptySampleForm(): SampleForm {
  return {
    id: null,
    sample_no: '',
    name: '',
    spec: '',
    project_no: '',
    location: '',
    status: '在库',
  }
}

async function loadList() {
  loading.value = true
  try {
    const result = await getSampleList({
      page: page.value,
      page_size: pageSize.value,
      sample_no: searchForm.sample_no || undefined,
      keyword: searchForm.keyword || undefined,
      project_no: searchForm.project_no || undefined,
      status: searchForm.status || undefined,
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
  dialogMode.value = 'create'
  Object.assign(form, emptySampleForm())
  dialogVisible.value = true
}

function openEdit(row: SampleItem) {
  dialogMode.value = 'edit'
  Object.assign(form, {
    id: row.id,
    sample_no: row.sample_no,
    name: row.name,
    spec: row.spec,
    project_no: row.project_no,
    location: row.location,
    status: row.status,
  })
  dialogVisible.value = true
}

function openView(row: SampleItem) {
  ElMessage.info(`查看样机「${row.name}」（功能待开发）`)
}

function openRecord(row: SampleItem) {
  ElMessage.info(`样机「${row.name}」的流转记录（功能待开发）`)
}

function handleImport() {
  ElMessage.info('批量导入（功能待开发）')
}

function handleExport() {
  ElMessage.success('导出成功（当前为 mock 数据）')
}

async function handleSubmit() {
  if (!form.sample_no || !form.name) {
    ElMessage.warning('请填写样机编码和样机名称')
    return
  }
  saving.value = true
  try {
    await createSample({
      sample_no: form.sample_no,
      name: form.name,
      spec: form.spec,
      project_no: form.project_no,
      location: form.location,
      status: form.status,
    })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

onMounted(loadList)
</script>

<style scoped>
.sample-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 14px;
  margin-bottom: 14px;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.field .label {
  flex: none;
  color: #606266;
  font-size: 13px;
  white-space: nowrap;
}

.field :deep(.el-input),
.field :deep(.el-select) {
  flex: 1;
  min-width: 0;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

.op-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
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

.el-col .field {
  margin-bottom: 18px;
}
</style>