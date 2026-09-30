<template>
  <div class="add-commission-page">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <!-- 基本信息 -->
      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">基本信息</span>
          </div>
        </template>
        <el-row :gutter="20">
          <!-- 第1行 -->
          <el-col :span="6">
            <el-form-item label="委托单编码" prop="commissionCode">
              <el-input v-model="form.commissionCode" placeholder="请输入委托单编码" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目编码" prop="projectCode">
              <el-input v-model="form.projectCode" placeholder="请输入项目编码" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="项目名称" prop="projectName">
              <el-input v-model="form.projectName" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="试验编码" prop="trialCode">
              <el-input v-model="form.trialCode" placeholder="请输入试验编码" />
            </el-form-item>
          </el-col>

          <!-- 第2行 -->
          <el-col :span="6">
            <el-form-item label="样机型号" prop="model">
              <el-input v-model="form.model" placeholder="请输入样机型号" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="样品数量" prop="sampleQuantity">
              <el-input-number v-model="form.sampleQuantity" :min="1" :step="1" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="样品类型" prop="sampleType">
              <el-select v-model="form.sampleType" placeholder="请选择" clearable>
                <el-option v-for="o in SAMPLE_TYPE_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="检测目的" prop="testPurpose">
              <el-select v-model="form.testPurpose" placeholder="请选择" clearable>
                <el-option v-for="o in TEST_PURPOSE_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 第3行 -->
          <el-col :span="6">
            <el-form-item label="紧急程度" prop="urgencyLevel">
              <el-select v-model="form.urgencyLevel" placeholder="请选择" clearable>
                <el-option v-for="o in URGENCY_LEVEL_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="试验状态" prop="trialStatus">
              <el-select v-model="form.trialStatus" placeholder="请选择">
                <el-option v-for="o in TRIAL_STATUS_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6"></el-col>
          <el-col :span="6"></el-col>

          <!-- 第4行 -->
          <el-col :span="6">
            <el-form-item label="委托人" prop="clientName">
              <el-input v-model="form.clientName" placeholder="请输入委托人" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="委托人电话" prop="clientPhone">
              <el-input v-model="form.clientPhone" placeholder="请输入委托人电话" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="委托部门" prop="department">
              <el-select v-model="form.department" placeholder="请选择" clearable>
                <el-option v-for="o in DEPARTMENT_OPTIONS" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6"></el-col>

          <!-- 第5行 -->
          <el-col :span="6">
            <el-form-item label="评价工程师" prop="evalEngineer">
              <el-input v-model="form.evalEngineer" placeholder="请输入评价工程师" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="评价工程师电话" prop="evalEngineerPhone">
              <el-input v-model="form.evalEngineerPhone" placeholder="请输入评价工程师电话" />
            </el-form-item>
          </el-col>
          <el-col :span="6"></el-col>
          <el-col :span="6"></el-col>

          <!-- 第6行 -->
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
            </el-form-item>
          </el-col>

          <!-- 第7行 -->
          <el-col :span="24">
            <el-form-item label="样品图片" prop="sampleImages">
              <el-upload
                v-model:file-list="form.sampleImages"
                action="/api/upload"
                list-type="picture-card"
                :headers="uploadHeaders"
                multiple
              >
                <el-icon><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>

          <!-- 第8行 -->
          <el-col :span="6">
            <el-form-item label="送样日期" prop="deliveryDate">
              <el-date-picker
                v-model="form.deliveryDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="委外测试" prop="isOutsourced">
              <el-radio-group v-model="form.isOutsourced" @change="handleOutsourcedChange">
                <el-radio :value="true">是</el-radio>
                <el-radio :value="false">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item v-show="form.isOutsourced === true" label="委外单位" prop="outsourcedUnit">
              <el-input v-model="form.outsourcedUnit" placeholder="请输入委外单位" />
            </el-form-item>
          </el-col>
          <el-col :span="6"></el-col>
        </el-row>
      </el-card>

      <!-- 检测项 -->
      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">检测项</span>
          </div>
        </template>
        <div class="op-bar">
          <el-button type="primary" :icon="Plus" size="small" @click="openTestItemDialog">新增检测项</el-button>
          <el-button size="small">批量删除</el-button>
        </div>
        <el-table :data="detectionRows" border size="small">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column label="测试类别" min-width="110">
            <template #default="{ row }"><el-input v-model="row.test_category" size="small" placeholder="请输入" /></template>
          </el-table-column>
          <el-table-column label="项目类别" min-width="110">
            <template #default="{ row }"><el-input v-model="row.item_category" size="small" placeholder="请输入" /></template>
          </el-table-column>
          <el-table-column label="检测项" min-width="110">
            <template #default="{ row }"><el-input v-model="row.detection_item" size="small" placeholder="请输入" /></template>
          </el-table-column>
          <el-table-column label="执行标准" min-width="120">
            <template #default="{ row }"><el-input v-model="row.standard" size="small" placeholder="请输入" /></template>
          </el-table-column>
          <el-table-column label="判定值" min-width="100">
            <template #header><span class="req">判定值</span></template>
            <template #default="{ row }"><el-input v-model="row.judgement_value" size="small" placeholder="请输入" /></template>
          </el-table-column>
          <el-table-column label="样品编号" min-width="120">
            <template #header><span class="req">样品编号</span></template>
            <template #default="{ row }"><el-input v-model="row.sample_no" size="small" placeholder="请输入" /></template>
          </el-table-column>
          <el-table-column label="测试基地" min-width="120">
            <template #header><span class="req">测试基地</span></template>
            <template #default="{ row }"><el-input v-model="row.test_base" size="small" placeholder="请输入" /></template>
          </el-table-column>
          <el-table-column label="标准工时" min-width="100">
            <template #default="{ row }"><el-input v-model="row.standard_hours" size="small" placeholder="请输入" /></template>
          </el-table-column>
          <el-table-column label="操作" width="70" fixed="right">
            <template #default="{ $index }">
              <el-button link type="danger" :icon="Delete" @click="removeDetectionItem($index)" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 其他信息 -->
      <el-card shadow="never" class="form-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">其他信息</span>
          </div>
        </template>
        <div class="other-row">
          <span class="other-label">附件</span>
          <el-button :icon="Upload">上传附件</el-button>
        </div>
        <div class="other-row">
          <span class="other-label">备注</span>
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </div>
      </el-card>
    </el-form>

    <TestItemSelectDialog
      v-model="testItemDialogVisible"
      :selected-ids="selectedTestItemIds"
      @confirm="handleTestItemConfirm"
    />

    <!-- 底部操作栏 -->
    <div class="footer-bar">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import {
  ElMessage,
  type FormInstance,
  type FormRules,
  type UploadUserFile,
} from 'element-plus'
import { Delete, Plus, Upload } from '@element-plus/icons-vue'
import TestItemSelectDialog from './TestItemSelectDialog.vue'
import type { TestItem } from '@/api/test-item'

interface CommissionForm {
  commissionCode: string
  projectCode: string
  projectName: string
  trialCode: string
  model: string
  sampleQuantity: number
  sampleType: string
  testPurpose: string
  urgencyLevel: string
  trialStatus: string
  clientName: string
  clientPhone: string
  department: string
  evalEngineer: string
  evalEngineerPhone: string
  remark: string
  sampleImages: UploadUserFile[]
  deliveryDate: string
  isOutsourced: boolean
  outsourcedUnit: string
  testItems: TestItem[]
}

interface DetectionRow {
  id: number
  test_category: string
  item_category: string
  detection_item: string
  standard: string
  judgement_value: string
  sample_no: string
  test_base: string
  standard_hours: string
}

const SAMPLE_TYPE_OPTIONS = ['整机', '零部件', '材料', '样件']
const TEST_PURPOSE_OPTIONS = ['性能验证', '可靠性验证', '型式试验', '摸底测试']
const URGENCY_LEVEL_OPTIONS = ['普通', '紧急', '特急']
const TRIAL_STATUS_OPTIONS = ['暂存', '进行中', '已完成', '已归档']
const DEPARTMENT_OPTIONS = ['研发中心', '品质管理部', '产品技术部', '市场部']

const formRef = ref<FormInstance>()
const submitting = ref(false)
const testItemDialogVisible = ref(false)
const selectedTestItemIds = computed(() => form.testItems.map((it) => it.id))

const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
}

const form = reactive<CommissionForm>({
  commissionCode: '',
  projectCode: '',
  projectName: '',
  trialCode: '',
  model: '',
  sampleQuantity: 1,
  sampleType: '',
  testPurpose: '',
  urgencyLevel: '普通',
  trialStatus: '暂存',
  clientName: '',
  clientPhone: '',
  department: '',
  evalEngineer: '',
  evalEngineerPhone: '',
  remark: '',
  sampleImages: [],
  deliveryDate: '',
  isOutsourced: false,
  outsourcedUnit: '',
  testItems: [],
})

const rules: FormRules<CommissionForm> = {
  commissionCode: [{ required: true, message: '请输入委托单编码', trigger: 'blur' }],
  projectCode: [{ required: true, message: '请输入项目编码', trigger: 'blur' }],
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  trialCode: [{ required: true, message: '请输入试验编码', trigger: 'blur' }],
  model: [{ required: true, message: '请输入样机型号', trigger: 'blur' }],
  sampleQuantity: [
    { required: true, type: 'number', min: 1, message: '请输入样品数量', trigger: 'blur' },
  ],
  clientName: [{ required: true, message: '请输入委托人', trigger: 'blur' }],
  clientPhone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  evalEngineerPhone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  outsourcedUnit: [
    {
      validator: (_rule, value, callback) => {
        if (form.isOutsourced && !value) {
          callback(new Error('请输入委外单位'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

const detectionRows = ref<DetectionRow[]>([])

function removeDetectionItem(index: number) {
  const row = detectionRows.value[index]
  if (row) {
    form.testItems = form.testItems.filter((it) => it.id !== row.id)
  }
  detectionRows.value.splice(index, 1)
}

function openTestItemDialog() {
  testItemDialogVisible.value = true
}

function handleTestItemConfirm(items: TestItem[]) {
  const existingIds = new Set(form.testItems.map((it) => it.id))
  items.forEach((it) => {
    if (!existingIds.has(it.id)) {
      form.testItems.push(it)
      existingIds.add(it.id)
      detectionRows.value.push({
        id: it.id,
        test_category: '',
        item_category: '',
        detection_item: `${it.code} ${it.name}（${it.unit}）`,
        standard: it.standard,
        judgement_value: '',
        sample_no: '',
        test_base: '',
        standard_hours: '',
      })
    }
  })
}

function handleOutsourcedChange(val: boolean) {
  if (!val) {
    form.outsourcedUnit = ''
  }
}

function handleSave() {
  ElMessage.success('保存成功（调试占位）')
}

function handleSubmit() {
  if (!formRef.value) return
  formRef.value.validate((valid) => {
    if (!valid) return
    submitting.value = true
    // TODO: 对接后端提交接口
    setTimeout(() => {
      submitting.value = false
      ElMessage.success('提交成功（调试占位）')
    }, 300)
  })
}

function handleCancel() {
  window.close()
}
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

.form-card :deep(.el-select),
.form-card :deep(.el-date-editor),
.form-card :deep(.el-input-number) {
  width: 100%;
}

.req::before {
  content: '*';
  color: #ff4d4f;
  margin-right: 2px;
}

.op-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.other-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.other-row:last-child {
  margin-bottom: 0;
}

.other-label {
  flex: none;
  width: 90px;
  color: #606266;
  font-size: 14px;
  line-height: 32px;
  text-align: right;
}

.other-row .el-textarea {
  flex: 1;
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