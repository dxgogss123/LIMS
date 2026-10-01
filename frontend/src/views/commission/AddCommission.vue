<template>
  <div class="add-commission-page">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <!-- 主表：委托基本信息 -->
      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">委托基本信息</span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="委托单号">
              <el-input v-model="form.commission_no" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="委托日期">
              <el-date-picker
                v-model="form.commission_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目编码" prop="project_code">
              <el-input v-model="form.project_code" placeholder="请输入项目编码" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目名称" prop="project_name">
              <el-input v-model="form.project_name" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="试验编码" prop="test_code">
              <el-input v-model="form.test_code" placeholder="请输入试验编码" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="样机型号" prop="sample_model">
              <el-input v-model="form.sample_model" placeholder="请输入样机型号" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="样品数量" prop="sample_quantity">
              <el-input-number v-model="form.sample_quantity" :min="1" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="样品类型">
              <el-select v-model="form.sample_type_id" placeholder="请选择" filterable clearable>
                <el-option
                  v-for="o in dictStore.enabledSampleTypes"
                  :key="o.id"
                  :label="o.name"
                  :value="o.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="检测目的">
              <el-select v-model="form.test_purpose_id" placeholder="请选择" filterable clearable>
                <el-option
                  v-for="o in dictStore.enabledTestPurposes"
                  :key="o.id"
                  :label="o.name"
                  :value="o.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="紧急程度">
              <el-select v-model="form.urgency_level" placeholder="请选择" clearable>
                <el-option v-for="o in URGENCY_LEVEL_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="试验状态">
              <el-select v-model="form.trial_status" placeholder="请选择" clearable>
                <el-option v-for="o in TRIAL_STATUS_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="委托人" prop="client_id">
              <el-select
                v-model="form.client_id"
                placeholder="按姓名/部门搜索"
                filterable
                remote
                :remote-method="searchClientsDebounced"
                :loading="clientLoading"
                clearable
                @change="onClientChange"
              >
                <el-option
                  v-for="c in clientOptions"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="联系电话">
              <el-input v-model="form.contact_phone" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="部门">
              <el-input v-model="form.department" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="职位">
              <el-input v-model="form.position" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="评价工程师">
              <el-input v-model="form.eval_engineer" placeholder="请输入评价工程师" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="评价工程师电话">
              <el-input v-model="form.eval_engineer_phone" placeholder="请输入评价工程师电话" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="送样日期">
              <el-date-picker
                v-model="form.delivery_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="委外测试">
              <el-radio-group v-model="form.is_outsourced" @change="handleOutsourcedChange">
                <el-radio :value="true">是</el-radio>
                <el-radio :value="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item v-show="form.is_outsourced" label="委外单位" prop="outsourced_unit">
              <el-input v-model="form.outsourced_unit" placeholder="请输入委外单位" />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="样品图片">
              <el-upload
                v-model:file-list="form.sample_images"
                action="/api/upload"
                list-type="picture-card"
                :headers="uploadHeaders"
                multiple
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 子表：样品检测明细 -->
      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">样品检测明细</span>
          </div>
        </template>
        <div class="op-bar">
          <el-button type="primary" :icon="Plus" size="small" @click="addDetail">添加样品</el-button>
          <el-button size="small" :disabled="selection.length === 0" @click="batchDelete">批量删除</el-button>
        </div>
        <el-table
          :data="form.details"
          border
          size="small"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="45" />
          <el-table-column type="index" label="序号" width="55" />
          <el-table-column label="项目分类" min-width="160">
            <template #default="{ row }">
              <el-select
                v-model="row.lab_id"
                placeholder="请选择实验室"
                filterable
                clearable
                size="small"
                @change="(val: number | null) => onLabChange(row, val)"
              >
                <el-option
                  v-for="o in dictStore.enabledLabs"
                  :key="o.id"
                  :label="o.name"
                  :value="o.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="检测项" min-width="170">
            <template #default="{ row }">
              <el-select
                v-model="row.test_item_id"
                placeholder="请先选择实验室"
                filterable
                clearable
                size="small"
                :disabled="row.lab_id == null"
                :loading="loadingTestItemLabId === row.lab_id"
                @change="(val: number | null) => onTestItemChange(row, val)"
              >
                <el-option
                  v-for="it in availableTestItems(row)"
                  :key="it.id"
                  :label="it.name"
                  :value="it.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="标准编号" min-width="120">
            <template #default="{ row }">{{ row.standard_code || '—' }}</template>
          </el-table-column>
          <el-table-column label="测试状态" min-width="130">
            <template #default="{ row }">
              <el-select v-model="row.status" placeholder="请选择" clearable size="small">
                <el-option v-for="s in TEST_STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="标准耗时" width="90">
            <template #default="{ row }">{{ row.duration || '—' }}</template>
          </el-table-column>
          <el-table-column label="数量" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" :step="1" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70" fixed="right">
            <template #default="{ $index }">
              <el-button link type="danger" :icon="Delete" @click="removeDetail($index)" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-form>

    <!-- 底部操作栏 -->
    <div class="footer-bar">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSave">保存</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import { useDictStore } from '@/stores/modules/dict'
import {
  createCommission,
  fetchClientList,
  fetchLabTestItems,
  genCommissionNo,
  isTestItemApplicable,
  type ClientItem,
  type CommissionDetailItem,
  type CommissionForm,
  type CommissionSubmitPayload,
  type LabTestItem,
} from '@/api/commission'

const router = useRouter()
const dictStore = useDictStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const URGENCY_LEVEL_OPTIONS = ['普通', '紧急', '特急']
const TRIAL_STATUS_OPTIONS = ['暂存', '进行中', '已完成', '已归档']
const TEST_STATUS_OPTIONS = [
  { value: 'draft', label: '暂存' },
  { value: 'auditing', label: '审核中' },
  { value: 'audited', label: '已审核' },
  { value: 'pending', label: '待排' },
  { value: 'binding', label: '待绑定' },
  { value: 'onstage', label: '待上台' },
  { value: 'testing', label: '测试中' },
  { value: 'report_making', label: '报告待制作' },
  { value: 'report_auditing', label: '报告审核中' },
  { value: 'report_rejected', label: '报告被驳回' },
  { value: 'terminated', label: '已终止' },
]
const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }

function todayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function createEmptyDetail(): CommissionDetailItem {
  return {
    sample_name: '',
    sample_type_id: null,
    test_purpose_id: null,
    lab_id: null,
    test_item_id: null,
    quantity: 1,
    standard_code: '',
    method: '',
    duration: '',
    status: '',
  }
}

const form = reactive<CommissionForm>({
  commission_no: genCommissionNo(),
  commission_date: todayStr(),
  client_id: null,
  client_name: '',
  contact_phone: '',
  department: '',
  position: '',
  project_code: '',
  project_name: '',
  test_code: '',
  sample_model: '',
  sample_quantity: 1,
  sample_type_id: null,
  test_purpose_id: null,
  urgency_level: '',
  trial_status: '',
  eval_engineer: '',
  eval_engineer_phone: '',
  sample_images: [],
  delivery_date: '',
  is_outsourced: false,
  outsourced_unit: '',
  remark: '',
  details: [createEmptyDetail()],
})

const rules: FormRules = {
  client_id: [{ required: true, message: '请选择委托人', trigger: 'change' }],
  project_code: [{ required: true, message: '请输入项目编码', trigger: 'blur' }],
  project_name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  test_code: [{ required: true, message: '请输入试验编码', trigger: 'blur' }],
  sample_model: [{ required: true, message: '请输入样机型号', trigger: 'blur' }],
  sample_quantity: [
    { required: true, type: 'number', min: 1, message: '请输入样品数量', trigger: 'blur' },
  ],
  eval_engineer_phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

// ---------- 委托人远程搜索（防抖 300ms） ----------

const clientOptions = ref<ClientItem[]>([])
const clientLoading = ref(false)
const clientMap = new Map<number, ClientItem>()

function debounce(fn: (keyword: string) => void, wait = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (keyword: string) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(keyword), wait)
  }
}

function searchClients(keyword: string) {
  clientLoading.value = true
  fetchClientList({ page: 1, page_size: 50, keyword: keyword || undefined })
    .then((res) => {
      clientOptions.value = res.items
      res.items.forEach((it) => clientMap.set(it.id, it))
    })
    .finally(() => {
      clientLoading.value = false
    })
}

const searchClientsDebounced = debounce((keyword: string) => searchClients(keyword), 300)

function onClientChange(id: number | null) {
  if (id == null) {
    form.client_name = ''
    form.contact_phone = ''
    form.department = ''
    form.position = ''
    return
  }
  let client = clientMap.get(id)
  if (!client) client = clientOptions.value.find((it) => it.id === id)
  if (client) {
    form.client_name = client.name
    form.contact_phone = client.phone
    form.department = client.department
    form.position = client.position
    // 保证选中项 label 始终可见（远程搜索会刷新选项列表）
    if (!clientOptions.value.some((it) => it.id === client!.id)) {
      clientOptions.value.push(client)
    }
  }
}

// ---------- 测试项目（按实验室懒加载缓存 + 条件过滤） ----------

const testItemsByLab = ref<Record<number, LabTestItem[]>>({})
const loadingTestItemLabId = ref<number | null>(null)

async function loadTestItems(labId: number) {
  if (testItemsByLab.value[labId]) return
  loadingTestItemLabId.value = labId
  try {
    const items = await fetchLabTestItems(labId, {})
    testItemsByLab.value[labId] = items
  } finally {
    loadingTestItemLabId.value = null
  }
}

function availableTestItems(row: CommissionDetailItem): LabTestItem[] {
  const items = testItemsByLab.value[row.lab_id ?? -1] ?? []
  return items.filter(
    (it) =>
      it.status === 'enabled' &&
      isTestItemApplicable(it, row.sample_type_id, row.test_purpose_id)
  )
}

function findTestItem(labId: number | null, itemId: number | null): LabTestItem | undefined {
  if (labId == null || itemId == null) return undefined
  return (testItemsByLab.value[labId] ?? []).find((it) => it.id === itemId)
}

function onLabChange(row: CommissionDetailItem, labId: number | null) {
  row.lab_id = labId
  row.test_item_id = null
  row.standard_code = ''
  row.method = ''
  row.duration = ''
  if (labId != null) loadTestItems(labId)
}

function onTestItemChange(row: CommissionDetailItem, itemId: number | null) {
  const item = itemId == null ? undefined : findTestItem(row.lab_id, itemId)
  row.standard_code = item?.standard_code ?? ''
  row.method = item?.method ?? ''
  row.duration = item?.duration ?? ''
}

// ---------- 子表行管理 ----------

const selection = ref<CommissionDetailItem[]>([])

function handleSelectionChange(rows: CommissionDetailItem[]) {
  selection.value = rows
}

function addDetail() {
  form.details.push(createEmptyDetail())
}

function removeDetail(index: number) {
  if (form.details.length <= 1) {
    ElMessage.warning('至少保留一行样品明细')
    return
  }
  form.details.splice(index, 1)
}

function batchDelete() {
  if (selection.value.length === 0) return
  ElMessageBox.confirm(`确定删除选中的 ${selection.value.length} 行样品明细吗？`, '提示', {
    type: 'warning',
  })
    .then(() => {
      if (form.details.length - selection.value.length < 1) {
        ElMessage.warning('至少保留一行样品明细，无法全部删除')
        return
      }
      const ids = new Set(selection.value.map((it) => it))
      form.details = form.details.filter((it) => !ids.has(it))
      selection.value = []
    })
    .catch(() => {})
}

// ---------- 提交 ----------

async function validate(): Promise<boolean> {
  if (!formRef.value) return false
  const mainValid = await formRef.value.validate().catch(() => false)
  if (!mainValid) return false
  for (let i = 0; i < form.details.length; i++) {
    const d = form.details[i]
    const idx = i + 1
    if (d.lab_id == null) {
      ElMessage.warning(`第 ${idx} 行：请选择实验室`)
      return false
    }
    if (d.test_item_id == null) {
      ElMessage.warning(`第 ${idx} 行：请选择检测项`)
      return false
    }
  }
  return true
}

function handleOutsourcedChange(val: boolean) {
  if (!val) {
    form.outsourced_unit = ''
  }
}

function buildPayload(): CommissionSubmitPayload {
  return {
    commission_no: form.commission_no,
    commission_date: form.commission_date,
    client_id: form.client_id!,
    client_name: form.client_name,
    project_code: form.project_code,
    project_name: form.project_name,
    test_code: form.test_code,
    sample_model: form.sample_model,
    sample_quantity: form.sample_quantity,
    sample_type_id: form.sample_type_id,
    test_purpose_id: form.test_purpose_id,
    urgency_level: form.urgency_level,
    trial_status: form.trial_status,
    eval_engineer: form.eval_engineer,
    eval_engineer_phone: form.eval_engineer_phone,
    sample_images: form.sample_images,
    delivery_date: form.delivery_date,
    is_outsourced: form.is_outsourced,
    outsourced_unit: form.outsourced_unit,
    remark: form.remark,
    details: form.details.map((d) => ({ ...d })),
  }
}

async function handleSave() {
  if (!(await validate())) return
  submitting.value = true
  try {
    await createCommission(buildPayload())
    ElMessage.success('保存成功')
    router.push('/entrust')
  } finally {
    submitting.value = false
  }
}

async function handleSubmit() {
  if (!(await validate())) return
  submitting.value = true
  try {
    await createCommission(buildPayload())
    ElMessage.success('提交成功')
    router.push('/entrust')
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  router.push('/entrust')
}

onMounted(() => {
  searchClients('')
  dictStore.ensureLoaded()
})
</script>

<style scoped>
.add-commission-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 138px);
  overflow: hidden;
}

.el-form {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.form-card {
  flex-shrink: 0;
  margin-bottom: 16px;
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
  background: #f5222d;
  border-radius: 2px;
}

.form-card :deep(.el-card__header) {
  padding: 12px 16px;
}

.form-card :deep(.el-card__body) {
  padding: 16px;
}

.form-card :deep(.el-form-item) {
  margin-bottom: 16px;
}

.form-card :deep(.el-select) {
  width: 100%;
}

.op-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.op-bar :deep(.el-table) .el-select {
  width: 100%;
}

.footer-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid #ebeef5;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}

.footer-bar :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>