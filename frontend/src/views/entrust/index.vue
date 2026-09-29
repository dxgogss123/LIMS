<template>
  <div class="entrust-page">
    <!-- 搜索区域 -->
    <el-card shadow="never" class="search-card">
      <div class="search-grid">
        <div class="field">
          <span class="label">项目编码</span>
          <el-input v-model="searchForm.project_no" placeholder="请输入" clearable />
        </div>
        <div class="field">
          <span class="label">项目名称</span>
          <el-input v-model="searchForm.project_name" placeholder="请输入" clearable />
        </div>
        <div class="field">
          <span class="label">样品型号</span>
          <el-input v-model="searchForm.sample_model" placeholder="请输入" clearable />
        </div>
        <div class="field">
          <span class="label">委托单号</span>
          <el-input v-model="searchForm.entrust_no" placeholder="请输入" clearable />
        </div>
        <div class="field">
          <span class="label">试验编码</span>
          <el-input v-model="searchForm.test_code" placeholder="请输入" clearable />
        </div>
      </div>

      <div class="search-grid">
        <div class="field">
          <span class="label">实验室</span>
          <el-select v-model="searchForm.lab" placeholder="请选择" clearable>
            <el-option v-for="o in LAB_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
        <div class="field">
          <span class="label">委托人</span>
          <el-input v-model="searchForm.client" placeholder="请输入" clearable />
        </div>
        <div class="field">
          <span class="label">委托部门</span>
          <el-input v-model="searchForm.entrust_dept" placeholder="请输入" clearable />
        </div>
        <div class="field">
          <span class="label">测试类别</span>
          <el-select v-model="searchForm.test_category" placeholder="请选择" clearable>
            <el-option v-for="o in TEST_CATEGORY_OPTIONS" :key="o" :label="o" :value="o" />
          </el-select>
        </div>
        <div class="field">
          <span class="label">班组</span>
          <el-input v-model="searchForm.team" placeholder="请输入" clearable />
        </div>
      </div>

      <div v-show="expanded">
        <div class="search-grid">
          <div class="field">
            <span class="label">测试状态</span>
            <el-select v-model="searchForm.status" placeholder="请选择" clearable>
              <el-option
                v-for="o in STATUS_OPTIONS"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </el-select>
          </div>
          <div class="field">
            <span class="label">测试结论</span>
            <el-select v-model="searchForm.test_conclusion" placeholder="请选择" clearable>
              <el-option v-for="o in CONCLUSION_OPTIONS" :key="o" :label="o" :value="o" />
            </el-select>
          </div>
          <div class="field">
            <span class="label">计划开始时间</span>
            <el-date-picker
              v-model="searchForm.plan_start_time"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="-"
              start-placeholder="开始"
              end-placeholder="结束"
            />
          </div>
          <div class="field">
            <span class="label">上台时间</span>
            <el-date-picker
              v-model="searchForm.onstage_time"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="-"
              start-placeholder="开始"
              end-placeholder="结束"
            />
          </div>
          <div class="field">
            <span class="label">创建时间</span>
            <el-date-picker
              v-model="searchForm.created_at"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="-"
              start-placeholder="开始"
              end-placeholder="结束"
            />
          </div>
        </div>

        <div class="search-grid">
          <div class="field">
            <span class="label">更新时间</span>
            <el-date-picker
              v-model="searchForm.updated_at"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="-"
              start-placeholder="开始"
              end-placeholder="结束"
            />
          </div>
          <div class="field">
            <span class="label">更新人</span>
            <el-input v-model="searchForm.updated_by" placeholder="请输入" clearable />
          </div>
        </div>

        <div class="search-grid">
          <div class="field">
            <span class="label">检测目的</span>
            <el-select v-model="searchForm.test_purpose" placeholder="请选择" clearable>
              <el-option v-for="o in PURPOSE_OPTIONS" :key="o" :label="o" :value="o" />
            </el-select>
          </div>
          <div class="field">
            <span class="label">计划审批状态</span>
            <el-select v-model="searchForm.plan_approve_status" placeholder="请选择" clearable>
              <el-option
                v-for="o in APPROVE_OPTIONS"
                :key="o"
                :label="o"
                :value="o"
              />
            </el-select>
          </div>
        </div>
      </div>

      <div class="search-actions">
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <el-button link type="primary" @click="expanded = !expanded">
          {{ expanded ? '收起' : '展开' }}
          <el-icon><component :is="expanded ? ArrowUp : ArrowDown" /></el-icon>
        </el-button>
      </div>
    </el-card>

    <!-- 操作栏 + Tab + 表格 + 分页 -->
    <el-card shadow="never" class="table-card">
      <div class="op-bar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增</el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </div>

      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="tab in TABS"
          :key="tab.value"
          :label="tab.label"
          :name="tab.value"
        />
      </el-tabs>

      <el-table
        v-loading="loading"
        :data="list"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="project_no" label="项目编码" width="150" />
        <el-table-column
          prop="project_name"
          label="项目名称"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="test_code" label="试验编码" width="150" />
        <el-table-column prop="test_purpose" label="检测目的" width="110" />
        <el-table-column prop="sample_model" label="样品型号" width="100" />
        <el-table-column prop="sample_name" label="样机名称" min-width="130" show-overflow-tooltip />
        <el-table-column prop="test_category" label="测试类别" width="110" />
        <el-table-column prop="entrust_dept" label="委托部门" width="110" />
        <el-table-column prop="team" label="班组" width="90" />
        <el-table-column prop="client" label="委托人" width="90" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type">{{ statusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
      :title="dialogMode === 'create' ? '新增委托单' : '编辑委托单'"
      width="70%"
      top="6vh"
      destroy-on-close
    >
      <el-tabs v-model="activeInfoTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-row :gutter="24">
            <el-col :span="12">
              <div class="field">
                <span class="label">项目编码</span>
                <el-input v-model="form.project_no" placeholder="请输入" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">项目名称</span>
                <el-input v-model="form.project_name" placeholder="请输入" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">试验编码</span>
                <el-input v-model="form.test_code" placeholder="请输入" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">委托单号</span>
                <el-input v-model="form.entrust_no" placeholder="请输入" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">检测目的</span>
                <el-select v-model="form.test_purpose" placeholder="请选择">
                  <el-option v-for="o in PURPOSE_OPTIONS" :key="o" :label="o" :value="o" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">样品型号</span>
                <el-input v-model="form.sample_model" placeholder="请输入" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">样机名称</span>
                <el-input v-model="form.sample_name" placeholder="请输入" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">测试类别</span>
                <el-select v-model="form.test_category" placeholder="请选择">
                  <el-option v-for="o in TEST_CATEGORY_OPTIONS" :key="o" :label="o" :value="o" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">委托部门</span>
                <el-input v-model="form.entrust_dept" placeholder="请输入" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">委托人</span>
                <el-input v-model="form.client" placeholder="请输入" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">班组</span>
                <el-input v-model="form.team" placeholder="请输入" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">状态</span>
                <el-select v-model="form.status">
                  <el-option
                    v-for="o in STATUS_OPTIONS"
                    :key="o.value"
                    :label="o.label"
                    :value="o.value"
                  />
                </el-select>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="测试信息" name="test">
          <el-row :gutter="24">
            <el-col :span="12">
              <div class="field">
                <span class="label">实验室</span>
                <el-select v-model="form.lab" placeholder="请选择">
                  <el-option v-for="o in LAB_OPTIONS" :key="o" :label="o" :value="o" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">测试结论</span>
                <el-select v-model="form.test_conclusion" placeholder="请选择">
                  <el-option v-for="o in CONCLUSION_OPTIONS" :key="o" :label="o" :value="o" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">计划开始时间</span>
                <el-date-picker
                  v-model="form.plan_start_time"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="请选择"
                />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">上台时间</span>
                <el-date-picker
                  v-model="form.onstage_time"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="请选择"
                />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">计划审批状态</span>
                <el-select v-model="form.plan_approve_status" placeholder="请选择">
                  <el-option v-for="o in APPROVE_OPTIONS" :key="o" :label="o" :value="o" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field">
                <span class="label">样品数量</span>
                <el-input-number v-model="form.sample_count" :min="1" style="width: 100%" />
              </div>
            </el-col>
            <el-col :span="24">
              <div class="field field-block">
                <span class="label">备注</span>
                <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入" />
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="样机信息" name="machine">
          <div class="machine-toolbar">
            <el-button type="primary" :icon="Plus" size="small" @click="addMachine">新增样机</el-button>
          </div>
          <el-table :data="form.machines" border size="small">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="样机编码" min-width="130">
              <template #default="{ row }">
                <el-input v-model="row.code" placeholder="请输入" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="样机名称" min-width="130">
              <template #default="{ row }">
                <el-input v-model="row.name" placeholder="请输入" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="外观型号" min-width="110">
              <template #default="{ row }">
                <el-input v-model="row.appearance_model" placeholder="请输入" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="风机电机" min-width="110">
              <template #default="{ row }">
                <el-input v-model="row.fan_motor" placeholder="请输入" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="电机转速" min-width="100">
              <template #default="{ row }">
                <el-input v-model="row.motor_speed" placeholder="请输入" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="毛细管规格" min-width="110">
              <template #default="{ row }">
                <el-input v-model="row.capillary_size" placeholder="请输入" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="软管版本" min-width="100">
              <template #default="{ row }">
                <el-input v-model="row.hose_version" placeholder="请输入" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" fixed="right">
              <template #default="{ $index }">
                <el-button link type="danger" @click="removeMachine($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, ArrowUp, Delete, Plus, Refresh, Search } from '@element-plus/icons-vue'
import type {
  MachineInfo,
  EntrustItem,
  EntrustQuery,
  EntrustStatus,
} from '@/api/entrust'
import {
  createEntrust,
  getEntrustList,
  updateEntrust,
} from '@/api/entrust'

type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

interface SearchForm {
  project_no: string
  project_name: string
  sample_model: string
  entrust_no: string
  test_code: string
  lab: string
  client: string
  entrust_dept: string
  test_category: string
  team: string
  status: string
  test_conclusion: string
  plan_start_time: string[]
  onstage_time: string[]
  created_at: string[]
  updated_at: string[]
  updated_by: string
  test_purpose: string
  plan_approve_status: string
}

interface LedgerForm {
  id: number | null
  project_no: string
  project_name: string
  test_code: string
  entrust_no: string
  test_purpose: string
  sample_model: string
  sample_name: string
  test_category: string
  entrust_dept: string
  client: string
  team: string
  status: EntrustStatus
  lab: string
  test_conclusion: string
  plan_start_time: string
  onstage_time: string
  plan_approve_status: string
  sample_count: number
  remark: string
  machines: MachineInfo[]
}

const STATUS_META: Record<EntrustStatus, { label: string; type: TagType }> = {
  draft: { label: '暂存', type: 'info' },
  auditing: { label: '审核中', type: 'warning' },
  audited: { label: '已审核', type: 'success' },
  pending: { label: '待排', type: 'info' },
  binding: { label: '待绑定', type: 'primary' },
  onstage: { label: '待上台', type: 'primary' },
  testing: { label: '测试中', type: 'primary' },
  report_making: { label: '报告待制作', type: 'warning' },
  report_auditing: { label: '报告审核中', type: 'warning' },
  report_rejected: { label: '报告被驳回', type: 'danger' },
  terminated: { label: '已终止', type: 'danger' },
}

const STATUS_OPTIONS = (Object.keys(STATUS_META) as EntrustStatus[]).map((value) => ({
  value,
  label: STATUS_META[value].label,
}))

const TABS: { value: string; label: string }[] = [
  { value: 'all', label: '全部' },
  ...STATUS_OPTIONS,
]

const LAB_OPTIONS = ['安全结构实验室', '性能实验室', '能效实验室', '噪音实验室']
const TEST_CATEGORY_OPTIONS = ['性能测试', '寿命测试', '安全测试', '能效测试']
const PURPOSE_OPTIONS = ['性能验证', '可靠性验证', '型式试验', '摸底测试']
const CONCLUSION_OPTIONS = ['合格', '不合格', '待判', '免检']
const APPROVE_OPTIONS = ['待审批', '已审批', '已驳回']

const list = ref<EntrustItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const expanded = ref(false)
const activeTab = ref('all')
const selectedRows = ref<EntrustItem[]>([])

const searchForm = reactive<SearchForm>(emptySearchForm())

function statusMeta(status: string): { label: string; type: TagType } {
  return STATUS_META[status as EntrustStatus] || { label: status, type: 'info' }
}

const dialogVisible = ref(false)
const saving = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const activeInfoTab = ref('basic')
const form = reactive<LedgerForm>(emptyLedgerForm())

function emptySearchForm(): SearchForm {
  return {
    project_no: '',
    project_name: '',
    sample_model: '',
    entrust_no: '',
    test_code: '',
    lab: '',
    client: '',
    entrust_dept: '',
    test_category: '',
    team: '',
    status: '',
    test_conclusion: '',
    plan_start_time: [],
    onstage_time: [],
    created_at: ['2026-06-29', '2026-09-29'],
    updated_at: [],
    updated_by: '',
    test_purpose: '',
    plan_approve_status: '',
  }
}

function emptyMachine(): MachineInfo {
  return {
    code: '',
    name: '',
    appearance_model: '',
    fan_motor: '',
    motor_speed: '',
    capillary_size: '',
    hose_version: '',
  }
}

function emptyLedgerForm(): LedgerForm {
  return {
    id: null,
    project_no: '',
    project_name: '',
    test_code: '',
    entrust_no: '',
    test_purpose: '',
    sample_model: '',
    sample_name: '',
    test_category: '',
    entrust_dept: '',
    client: '',
    team: '',
    status: 'draft',
    lab: '',
    test_conclusion: '',
    plan_start_time: '',
    onstage_time: '',
    plan_approve_status: '',
    sample_count: 1,
    remark: '',
    machines: [],
  }
}

function buildQuery(): EntrustQuery {
  const query: EntrustQuery = { page: page.value, page_size: pageSize.value }
  const status = activeTab.value === 'all' ? searchForm.status || undefined : activeTab.value
  if (status) query.status = status
  ;(Object.keys(searchForm) as (keyof SearchForm)[]).forEach((key) => {
    const value = searchForm[key]
    if (typeof value === 'string' && value) query[key] = value
  })
  return query
}

async function loadList() {
  loading.value = true
  try {
    const result = await getEntrustList(buildQuery())
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

function handleTabChange() {
  page.value = 1
  loadList()
}

function handleSizeChange() {
  page.value = 1
  loadList()
}

function handleSelectionChange(rows: EntrustItem[]) {
  selectedRows.value = rows
}

function openCreate() {
  dialogMode.value = 'create'
  Object.assign(form, emptyLedgerForm())
  activeInfoTab.value = 'basic'
  dialogVisible.value = true
}

function openEdit(row: EntrustItem) {
  dialogMode.value = 'edit'
  Object.assign(form, emptyLedgerForm(), {
    id: row.id,
    project_no: row.project_no,
    project_name: row.project_name,
    test_code: row.test_code,
    entrust_no: row.entrust_no || '',
    test_purpose: row.test_purpose,
    sample_model: row.sample_model,
    sample_name: row.sample_name,
    test_category: row.test_category,
    entrust_dept: row.entrust_dept,
    client: row.client,
    team: row.team,
    status: row.status,
    lab: row.lab || '',
    plan_start_time: row.plan_start_time || '',
    onstage_time: row.onstage_time || '',
    plan_approve_status: row.plan_approve_status || '',
    sample_count: row.sample_count || 1,
    remark: row.remark || '',
    machines: row.machines?.length ? row.machines.map((m) => ({ ...m })) : [],
  })
  activeInfoTab.value = 'basic'
  dialogVisible.value = true
}

function addMachine() {
  form.machines.push(emptyMachine())
}

function removeMachine(index: number) {
  form.machines.splice(index, 1)
}

async function handleSubmit() {
  if (!form.project_no || !form.project_name) {
    ElMessage.warning('请填写项目编码和项目名称')
    return
  }
  saving.value = true
  try {
    const payload: Partial<EntrustItem> = {
      project_no: form.project_no,
      project_name: form.project_name,
      test_code: form.test_code,
      entrust_no: form.entrust_no,
      test_purpose: form.test_purpose,
      sample_model: form.sample_model,
      sample_name: form.sample_name,
      test_category: form.test_category,
      entrust_dept: form.entrust_dept,
      client: form.client,
      team: form.team,
      status: form.status,
      lab: form.lab,
      plan_approve_status: form.plan_approve_status,
      sample_count: form.sample_count,
      plan_start_time: form.plan_start_time,
      onstage_time: form.onstage_time,
      remark: form.remark,
      machines: form.machines,
    }
    if (dialogMode.value === 'edit' && form.id) {
      await updateEntrust(form.id, payload)
    } else {
      await createEntrust(payload)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadList()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: EntrustItem) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.project_name}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  // 当前为 mock 阶段，后端删除接口就绪后替换
  ElMessage.success('删除成功')
  loadList()
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '提示',
      { type: 'warning' },
    )
  } catch {
    return
  }
  // 当前为 mock 阶段，后端批量删除接口就绪后替换
  ElMessage.success(`已删除 ${selectedRows.value.length} 条记录`)
  loadList()
}

onMounted(loadList)
</script>

<style scoped>
.entrust-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
.field :deep(.el-select),
.field :deep(.el-date-editor) {
  flex: 1;
  min-width: 0;
}

.field-block {
  align-items: flex-start;
}

.field-block .label {
  padding-top: 6px;
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

.machine-toolbar {
  margin-bottom: 12px;
}

.el-col + .el-col .field,
.el-col + .el-col .field {
  margin-bottom: 14px;
}

.el-col .field {
  margin-bottom: 14px;
}
</style>