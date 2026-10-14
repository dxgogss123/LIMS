<template>
  <div class="lab-page" @click="closeContextMenu">
    <el-card class="lab-card">
      <div class="lab-card__header">
        <span class="lab-card__title">实验室</span>
        <div class="lab-card__header-actions">
          <el-button v-if="userStore.canManage" link type="primary" :icon="Upload" @click="triggerImportLabs">导入</el-button>
          <el-button link type="primary" :icon="Download" @click="exportLabs">导出</el-button>
          <el-button v-if="userStore.canManage" link type="primary" :icon="Plus" @click="openLabCreate">新增</el-button>
        </div>
      </div>

      <div v-loading="labsLoading" class="lab-list">
        <div
          v-for="lab in labs"
          :key="lab.id"
          class="lab-item"
          :class="{ active: lab.id === selectedLabId, disabled: lab.status === 'disabled' }"
          draggable="true"
          @click="selectLab(lab)"
          @contextmenu.prevent="openContextMenu($event, lab)"
          @dragstart="onDragStart(lab)"
          @dragover.prevent
          @drop="onDrop(lab)"
        >
          <span class="lab-item__name">{{ lab.name }}</span>
          <div v-if="userStore.canManage" class="lab-item__actions">
            <el-button link type="primary" size="small" :icon="Edit" @click.stop="openLabEdit(lab)" />
            <el-button link type="danger" size="small" :icon="Delete" @click.stop="handleDeleteLab(lab)" />
          </div>
          <el-badge :value="lab.test_item_count" :max="99" type="primary" class="lab-item__badge" />
        </div>
        <el-empty v-if="!labsLoading && !labs.length" description="暂无实验室" :image-size="60" />
      </div>
    </el-card>

    <el-card class="detail-card">
      <template v-if="currentLab">
        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item>实验室管理</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentLab.name }}</el-breadcrumb-item>
        </el-breadcrumb>

        <div class="lab-meta">
          <div class="lab-meta__info">
            <span>负责人：{{ currentLab.manager || '-' }}</span>
            <span>联系电话：{{ currentLab.contact_phone || '-' }}</span>
            <span>地址：{{ currentLab.location || '-' }}</span>
          </div>
          <div class="lab-meta__capacity">
            <span>项目容量：{{ currentLab.test_item_count }} / {{ currentLab.max_capacity }}</span>
            <el-progress
              :percentage="capacityPercent"
              :stroke-width="10"
              :show-text="false"
              style="width: 120px"
            />
          </div>
        </div>

        <div class="toolbar">
          <el-input v-model="filter.standard" placeholder="按标准编号筛选" clearable style="width: 180px" @keyup.enter="loadTestItems" />
          <el-input v-model="filter.method" placeholder="按检测方法筛选" clearable style="width: 180px" @keyup.enter="loadTestItems" />
          <el-button type="primary" :icon="Search" @click="loadTestItems">筛选</el-button>
          <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
          <el-button :icon="Download" @click="exportTestItems">导出</el-button>
          <template v-if="userStore.canManage">
            <el-button :icon="Upload" style="margin-left: auto" @click="triggerImportTestItems">导入</el-button>
            <el-button type="primary" :icon="Plus" @click="openTestItemCreate">
              新增项目
            </el-button>
            <el-button :icon="DocumentCopy" :disabled="!selectedItems.length" @click="openCopyDialog">
              复制到其他实验室
            </el-button>
            <el-button type="danger" :icon="Delete" :disabled="!selectedItems.length" @click="handleBatchDeleteTestItems">
              批量删除
            </el-button>
          </template>
        </div>

        <el-table
          v-loading="itemsLoading"
          :data="testItems"
          stripe
          :row-class-name="itemRowClassName"
          @selection-change="handleItemSelectionChange"
        >
          <el-table-column v-if="userStore.canManage" type="selection" width="50" />
          <el-table-column label="项目名称" prop="name" min-width="140" show-overflow-tooltip />
          <el-table-column label="所属标准" prop="standard_code" min-width="140" show-overflow-tooltip />
          <el-table-column label="检测方法" prop="method" min-width="200" show-overflow-tooltip />
          <el-table-column label="所需设备" prop="equipment" min-width="130" show-overflow-tooltip />
          <el-table-column label="预计耗时" prop="duration" width="90" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status"
                active-value="enabled"
                inactive-value="disabled"
                @change="(val: string | number | boolean) => handleToggleTestItemStatus(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column v-if="userStore.canManage" label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openTestItemEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDeleteTestItem(row)">删除</el-button>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="该实验室暂无测试项目" :image-size="80" />
          </template>
        </el-table>
      </template>

      <el-empty v-else description="请选择左侧实验室" :image-size="100" />
    </el-card>

    <!-- 右键菜单 -->
    <template v-if="ctxMenu.visible">
      <div class="ctx-overlay" @click="closeContextMenu" />
      <div class="ctx-menu" :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }">
        <div class="ctx-menu__item" @click="quickEditFrom(ctxMenu.labId)">快速编辑</div>
        <div class="ctx-menu__item" @click="editLabFrom(ctxMenu.labId)">编辑</div>
        <div class="ctx-menu__item" @click="cloneLabFrom(ctxMenu.labId)">复制实验室配置</div>
        <div class="ctx-menu__item ctx-menu__item--danger" @click="deleteLabFrom(ctxMenu.labId)">删除实验室</div>
      </div>
    </template>

    <!-- 实验室表单 -->
    <el-dialog v-model="labDialogVisible" :title="labForm.id ? '编辑实验室' : '新增实验室'" width="520px">
      <el-form ref="labFormRef" :model="labForm" :rules="labRules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="labForm.name" placeholder="请输入实验室名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="labForm.code" placeholder="请输入编码" />
        </el-form-item>
        <el-form-item v-if="!labForm.id" label="实验室模板">
          <el-select v-model="labTemplateId" clearable placeholder="选择模板（可选）可预置测试项目" style="width: 100%">
            <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="labForm.location" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="labForm.manager" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model="labForm.contact_phone" maxlength="11" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="最大项目数">
          <el-input-number v-model="labForm.max_capacity" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="labForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="labDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="labSaving" @click="handleLabSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 快速编辑 -->
    <el-dialog v-model="quickEditVisible" title="快速编辑实验室" width="420px">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="quickEditForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="quickEditForm.manager" placeholder="请输入负责人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickEditVisible = false">取消</el-button>
        <el-button type="primary" :loading="quickEditSaving" @click="handleQuickEditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 测试项目表单 -->
    <el-dialog v-model="testItemDialogVisible" :title="testItemForm.id ? '编辑测试项目' : '新增测试项目'" width="600px">
      <el-form ref="testItemFormRef" :model="testItemForm" :rules="testItemRules" label-width="90px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="testItemForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="标准编号" prop="standard_code">
          <el-input v-model="testItemForm.standard_code" placeholder="请输入标准编号，如 GB/T 2423.2" />
        </el-form-item>
        <el-form-item label="检测方法" prop="method">
          <el-input v-model="testItemForm.method" type="textarea" :rows="2" placeholder="请输入检测方法描述" />
        </el-form-item>
        <el-form-item label="所需设备">
          <el-input v-model="testItemForm.equipment" placeholder="请输入所需设备" />
        </el-form-item>
        <el-form-item label="预计耗时" prop="duration">
          <el-input v-model="testItemForm.duration" placeholder="如 2h / 0.5h" />
        </el-form-item>
        <el-form-item label="适用样品类型" prop="sample_type_ids">
          <el-select v-model="testItemForm.sample_type_ids" multiple placeholder="请选择适用样品类型" style="width: 100%">
            <el-option v-for="s in sampleOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testItemDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="testItemSaving" @click="handleTestItemSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 复制项目到其他实验室 -->
    <el-dialog v-model="copyDialogVisible" title="复制测试项目到其他实验室" width="420px">
      <el-form label-width="80px">
        <el-form-item label="目标实验室">
          <el-select v-model="copyTargetLabId" placeholder="请选择目标实验室" style="width: 100%">
            <el-option
              v-for="l in labs.filter((it) => it.id !== selectedLabId)"
              :key="l.id"
              :label="l.name"
              :value="l.id"
            />
          </el-select>
        </el-form-item>
        <div class="copy-hint">将复制当前选中的 {{ selectedItems.length }} 个测试项目到目标实验室。</div>
      </el-form>
      <template #footer>
        <el-button @click="copyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="copySaving" @click="handleCopySubmit">确定复制</el-button>
      </template>
    </el-dialog>

    <input ref="labImportInputRef" type="file" accept=".csv" style="display: none" @change="handleImportLabsFile" />
    <input ref="itemImportInputRef" type="file" accept=".csv" style="display: none" @change="handleImportTestItemsFile" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, DocumentCopy, Download, Edit, Plus, Refresh, Search, Upload } from '@element-plus/icons-vue'
import { downloadCsv } from '@/utils/csv'
import {
  LAB_HEADERS,
  TEST_ITEM_HEADERS,
  labToRow,
  parseCsvToRows,
  parseLabRow,
  parseTestItemRow,
  testItemToRow,
} from '@/utils/import-export'
import type { EntityStatus, Lab, LabTemplate, LabTestItem, SampleType, TestPurpose } from '@/api/system'
import {
  cloneLabConfig,
  copyTestItems,
  createLab,
  createLabTestItem,
  deleteLab,
  deleteLabTestItems,
  getLabList,
  getLabTemplates,
  getLabTestItems,
  getSampleTypeList,
  getTestPurposeList,
  quickEditLab,
  reorderLabs,
  toggleLabTestItemStatus,
  updateLab,
  updateLabTestItem,
} from '@/api/system'
import { useLabStore } from '@/stores/modules/lab'
import { useUserStore } from '@/stores/modules/user'

interface LabForm {
  id: number | null
  name: string
  code: string
  location: string
  manager: string
  contact_phone: string
  max_capacity: number
  remark: string
}

interface TestItemForm {
  id: number | null
  name: string
  standard_code: string
  method: string
  equipment: string
  duration: string
  sample_type_ids: number[]
  purpose_ids: number[]
}

const userStore = useUserStore()
const labStore = useLabStore()

const labs = ref<Lab[]>([])
const templates = ref<LabTemplate[]>([])
const testItems = ref<LabTestItem[]>([])
const sampleOptions = ref<SampleType[]>([])
const purposeOptions = ref<TestPurpose[]>([])
const labsLoading = ref(false)
const itemsLoading = ref(false)

const selectedLabId = computed(() => labStore.selectedLabId)
const currentLab = computed(() => labs.value.find((l) => l.id === selectedLabId.value) ?? null)
const capacityPercent = computed(() => {
  if (!currentLab.value || !currentLab.value.max_capacity) return 0
  return Math.min(100, Math.round((currentLab.value.test_item_count / currentLab.value.max_capacity) * 100))
})

const filter = reactive({ standard: '', method: '' })
const selectedItems = ref<LabTestItem[]>([])

// 拖拽排序
const draggingLabId = ref<number | null>(null)

// 右键菜单
const ctxMenu = reactive({ visible: false, x: 0, y: 0, labId: 0 })

// 实验室表单
const labDialogVisible = ref(false)
const labSaving = ref(false)
const labFormRef = ref<FormInstance>()
const labTemplateId = ref<number | null>(null)
const labForm = reactive<LabForm>({
  id: null,
  name: '',
  code: '',
  location: '',
  manager: '',
  contact_phone: '',
  max_capacity: 20,
  remark: '',
})

// 快速编辑
const quickEditVisible = ref(false)
const quickEditSaving = ref(false)
const quickEditForm = reactive({ id: 0, name: '', manager: '' })

// 测试项目表单
const testItemDialogVisible = ref(false)
const testItemSaving = ref(false)
const testItemFormRef = ref<FormInstance>()
const testItemForm = reactive<TestItemForm>({
  id: null,
  name: '',
  standard_code: '',
  method: '',
  equipment: '',
  duration: '',
  sample_type_ids: [],
  purpose_ids: [],
})

// 复制对话框
const copyDialogVisible = ref(false)
const copySaving = ref(false)
const copyTargetLabId = ref<number | null>(null)

// 导入导出
const labImportInputRef = ref<HTMLInputElement>()
const itemImportInputRef = ref<HTMLInputElement>()

const labRules: FormRules<LabForm> = {
  name: [{ required: true, message: '请输入实验室名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入实验室编码', trigger: 'blur' }],
  contact_phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
}

const testItemRules: FormRules<TestItemForm> = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  standard_code: [{ required: true, message: '请输入标准编号', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入预计耗时', trigger: 'blur' }],
}

async function loadLabs() {
  labsLoading.value = true
  try {
    labs.value = await getLabList()
  } catch {
    ElMessage.error('实验室加载失败')
  } finally {
    labsLoading.value = false
  }
}

async function loadTestItems() {
  if (!selectedLabId.value) return
  itemsLoading.value = true
  try {
    testItems.value = await getLabTestItems(selectedLabId.value, filter)
  } catch {
    ElMessage.error('测试项目加载失败')
  } finally {
    itemsLoading.value = false
  }
}

async function loadOptions() {
  const [types, purposes, tpls] = await Promise.all([
    getSampleTypeList({ page: 1, page_size: 1000 }),
    getTestPurposeList({ page: 1, page_size: 1000 }),
    getLabTemplates(),
  ])
  sampleOptions.value = types.items.filter((it) => it.status === 'enabled')
  purposeOptions.value = purposes.items.filter((it) => it.status === 'enabled')
  templates.value = tpls
}

function selectLab(lab: Lab) {
  labStore.selectLab(lab.id)
  filter.standard = ''
  filter.method = ''
  loadTestItems()
}

function resetFilter() {
  filter.standard = ''
  filter.method = ''
  loadTestItems()
}

function handleItemSelectionChange(rows: LabTestItem[]) {
  selectedItems.value = rows
}

function itemRowClassName({ row }: { row: LabTestItem }): string {
  return row.status === 'disabled' ? 'disabled-row' : ''
}

// ---------- 拖拽排序 ----------

function onDragStart(lab: Lab) {
  draggingLabId.value = lab.id
}

async function onDrop(target: Lab) {
  const fromId = draggingLabId.value
  draggingLabId.value = null
  if (fromId == null || fromId === target.id) return
  const fromIdx = labs.value.findIndex((l) => l.id === fromId)
  const toIdx = labs.value.findIndex((l) => l.id === target.id)
  if (fromIdx < 0 || toIdx < 0) return
  const arr = [...labs.value]
  const [moved] = arr.splice(fromIdx, 1)
  arr.splice(toIdx, 0, moved)
  labs.value = arr
  try {
    await reorderLabs(arr.map((l) => l.id))
    ElMessage.success('排序已更新')
  } catch {
    ElMessage.error('排序保存失败')
  }
}

// ---------- 右键菜单 ----------

function openContextMenu(e: MouseEvent, lab: Lab) {
  ctxMenu.visible = true
  ctxMenu.x = e.clientX
  ctxMenu.y = e.clientY
  ctxMenu.labId = lab.id
}

function closeContextMenu() {
  ctxMenu.visible = false
}

function quickEditFrom(id: number) {
  closeContextMenu()
  const lab = labs.value.find((l) => l.id === id)
  if (!lab) return
  quickEditForm.id = lab.id
  quickEditForm.name = lab.name
  quickEditForm.manager = lab.manager
  quickEditVisible.value = true
}

function editLabFrom(id: number) {
  closeContextMenu()
  const lab = labs.value.find((l) => l.id === id)
  if (lab) openLabEdit(lab)
}

function deleteLabFrom(id: number) {
  closeContextMenu()
  const lab = labs.value.find((l) => l.id === id)
  if (lab) handleDeleteLab(lab)
}

async function cloneLabFrom(id: number) {
  closeContextMenu()
  const lab = labs.value.find((l) => l.id === id)
  if (!lab) return
  try {
    await ElMessageBox.confirm(`确定复制实验室「${lab.name}」及其测试项目吗？`, '复制实验室', { type: 'warning' })
  } catch {
    return
  }
  try {
    const clone = await cloneLabConfig(id)
    ElMessage.success('复制成功')
    await loadLabs()
    labStore.selectLab(clone.id)
    loadTestItems()
  } catch {
    ElMessage.error('复制失败')
  }
}

async function handleQuickEditSubmit() {
  if (!quickEditForm.name.trim()) {
    ElMessage.warning('请输入名称')
    return
  }
  quickEditSaving.value = true
  try {
    await quickEditLab(quickEditForm.id, quickEditForm.name, quickEditForm.manager)
    ElMessage.success('保存成功')
    quickEditVisible.value = false
    loadLabs()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    quickEditSaving.value = false
  }
}

// ---------- 实验室 CRUD ----------

function openLabCreate() {
  Object.assign(labForm, {
    id: null,
    name: '',
    code: '',
    location: '',
    manager: '',
    contact_phone: '',
    max_capacity: 20,
    remark: '',
  })
  labTemplateId.value = null
  labFormRef.value?.clearValidate()
  labDialogVisible.value = true
}

function openLabEdit(lab: Lab) {
  Object.assign(labForm, {
    id: lab.id,
    name: lab.name,
    code: lab.code,
    location: lab.location,
    manager: lab.manager,
    contact_phone: lab.contact_phone,
    max_capacity: lab.max_capacity,
    remark: lab.remark ?? '',
  })
  labTemplateId.value = null
  labFormRef.value?.clearValidate()
  labDialogVisible.value = true
}

async function handleLabSubmit() {
  if (!labFormRef.value) return
  const valid = await labFormRef.value.validate().catch(() => false)
  if (!valid) return
  labSaving.value = true
  const payload = {
    name: labForm.name,
    code: labForm.code,
    location: labForm.location,
    manager: labForm.manager,
    contact_phone: labForm.contact_phone,
    max_capacity: labForm.max_capacity,
    status: 'enabled' as EntityStatus,
    remark: labForm.remark || undefined,
  }
  try {
    let targetId = labForm.id
    if (labForm.id) {
      await updateLab(labForm.id, payload)
    } else {
      const created = await createLab(payload, labTemplateId.value ?? undefined)
      targetId = created.id
    }
    ElMessage.success('保存成功')
    labDialogVisible.value = false
    await loadLabs()
    if (!currentLab.value || targetId) {
      labStore.selectLab(targetId)
    }
    loadTestItems()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    labSaving.value = false
  }
}

async function handleDeleteLab(lab: Lab) {
  try {
    await ElMessageBox.confirm(`确定删除实验室「${lab.name}」及其全部测试项目吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteLab(lab.id)
    ElMessage.success('删除成功')
    if (selectedLabId.value === lab.id) labStore.selectLab(null)
    await loadLabs()
    if (!selectedLabId.value && labs.value.length) {
      labStore.selectLab(labs.value[0].id)
    }
    loadTestItems()
  } catch {
    ElMessage.error('删除失败')
  }
}

// ---------- 测试项目 CRUD ----------

function openTestItemCreate() {
  Object.assign(testItemForm, {
    id: null,
    name: '',
    standard_code: '',
    method: '',
    equipment: '',
    duration: '',
    sample_type_ids: [],
    purpose_ids: [],
  })
  testItemFormRef.value?.clearValidate()
  testItemDialogVisible.value = true
}

function openTestItemEdit(row: LabTestItem) {
  Object.assign(testItemForm, {
    id: row.id,
    name: row.name,
    standard_code: row.standard_code,
    method: row.method,
    equipment: row.equipment,
    duration: row.duration,
    sample_type_ids: [...row.sample_type_ids],
    purpose_ids: [...row.purpose_ids],
  })
  testItemFormRef.value?.clearValidate()
  testItemDialogVisible.value = true
}

async function handleTestItemSubmit() {
  if (!testItemFormRef.value || !selectedLabId.value) return
  const valid = await testItemFormRef.value.validate().catch(() => false)
  if (!valid) return
  testItemSaving.value = true
  const payload = {
    lab_id: selectedLabId.value,
    name: testItemForm.name,
    standard_code: testItemForm.standard_code,
    method: testItemForm.method,
    equipment: testItemForm.equipment,
    duration: testItemForm.duration,
    sample_type_ids: testItemForm.sample_type_ids,
    purpose_ids: testItemForm.purpose_ids,
    status: 'enabled' as EntityStatus,
  }
  try {
    if (testItemForm.id) {
      await updateLabTestItem(testItemForm.id, payload)
    } else {
      await createLabTestItem(payload)
    }
    ElMessage.success('保存成功')
    testItemDialogVisible.value = false
    await loadTestItems()
    loadLabs()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    testItemSaving.value = false
  }
}

async function handleToggleTestItemStatus(row: LabTestItem, val: string | number | boolean) {
  const next = val as EntityStatus
  try {
    await toggleLabTestItemStatus(row.id, next)
    row.status = next
    ElMessage.success(next === 'enabled' ? '已启用' : '已禁用')
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleDeleteTestItem(row: LabTestItem) {
  try {
    await ElMessageBox.confirm(`确定删除测试项目「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteLabTestItems([row.id])
    ElMessage.success('删除成功')
    await loadTestItems()
    loadLabs()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function handleBatchDeleteTestItems() {
  if (!selectedItems.value.length) {
    ElMessage.warning('请至少选择一项')
    return
  }
  const names = selectedItems.value.map((it) => it.name)
  try {
    await ElMessageBox.confirm(`确定删除以下 ${names.length} 个测试项目吗？\n${names.join('、')}`, '批量删除', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteLabTestItems(selectedItems.value.map((it) => it.id))
    ElMessage.success('删除成功')
    await loadTestItems()
    loadLabs()
  } catch {
    ElMessage.error('删除失败')
  }
}

// ---------- 复制项目 ----------

function openCopyDialog() {
  if (!selectedItems.value.length) {
    ElMessage.warning('请先选择要复制的测试项目')
    return
  }
  copyTargetLabId.value = null
  copyDialogVisible.value = true
}

async function handleCopySubmit() {
  if (!copyTargetLabId.value || !selectedLabId.value) {
    ElMessage.warning('请选择目标实验室')
    return
  }
  copySaving.value = true
  try {
    await copyTestItems(selectedLabId.value, copyTargetLabId.value)
    ElMessage.success('复制成功')
    copyDialogVisible.value = false
    loadLabs()
  } catch {
    ElMessage.error('复制失败')
  } finally {
    copySaving.value = false
  }
}

// ---------- 导入导出 ----------

function exportLabs() {
  const data = labs.value.map((l) => labToRow(l))
  downloadCsv('实验室列表.csv', LAB_HEADERS, data)
  ElMessage.success('导出成功')
}

function triggerImportLabs() {
  labImportInputRef.value?.click()
}

async function handleImportLabsFile(ev: Event) {
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
    for (let i = 0; i < rows.length; i++) {
      const row = parseLabRow(rows[i])
      if (!row.name) continue
      await createLab({ ...row, code: row.code || `LAB_${Date.now()}_${i}` })
      count++
    }
    ElMessage.success(`导入成功，共 ${count} 条`)
    await loadLabs()
  } catch {
    ElMessage.error('导入失败，请检查文件格式')
  } finally {
    input.value = ''
  }
}

function exportTestItems() {
  if (!currentLab.value) {
    ElMessage.warning('请先选择实验室')
    return
  }
  const data = testItems.value.map((it) => testItemToRow(it, sampleOptions.value, purposeOptions.value))
  downloadCsv(`测试项目-${currentLab.value.name}.csv`, TEST_ITEM_HEADERS, data)
  ElMessage.success('导出成功')
}

function triggerImportTestItems() {
  itemImportInputRef.value?.click()
}

async function handleImportTestItemsFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!selectedLabId.value) {
    ElMessage.warning('请先选择实验室')
    return
  }
  try {
    const rows = parseCsvToRows(await file.text())
    if (!rows.length) {
      ElMessage.warning('文件内容为空')
      return
    }
    let count = 0
    for (const cells of rows) {
      const row = parseTestItemRow(cells, selectedLabId.value, sampleOptions.value, purposeOptions.value)
      if (!row.name) continue
      await createLabTestItem(row)
      count++
    }
    ElMessage.success(`导入成功，共 ${count} 条`)
    await loadTestItems()
    loadLabs()
  } catch {
    ElMessage.error('导入失败，请检查文件格式')
  } finally {
    input.value = ''
  }
}

onMounted(async () => {
  await loadLabs()
  loadOptions()
  if (!selectedLabId.value && labs.value.length) {
    labStore.selectLab(labs.value[0].id)
  }
  await loadTestItems()
})
</script>

<style scoped>
.lab-page {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.lab-card {
  width: 280px;
  flex-shrink: 0;
}

.lab-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.lab-card__title {
  font-weight: 600;
}

.lab-list {
  max-height: 560px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lab-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.lab-item:hover {
  background-color: rgba(24, 144, 255, 0.06);
}

.lab-item.active {
  background-color: #e6f2ff;
  border-color: #1890ff;
}

.lab-item.disabled .lab-item__name {
  color: #c0c4cc;
}

.lab-item__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lab-item__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-right: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.lab-item:hover .lab-item__actions {
  opacity: 1;
}

.detail-card {
  flex: 1;
  min-width: 0;
}

.breadcrumb {
  margin-bottom: 12px;
}

.lab-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.lab-meta__info {
  display: flex;
  gap: 16px;
  color: #606266;
  font-size: 13px;
  flex-wrap: wrap;
}

.lab-meta__capacity {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.copy-hint {
  font-size: 13px;
  color: #909399;
}

.ctx-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.ctx-menu {
  position: fixed;
  z-index: 2001;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  min-width: 160px;
}

.ctx-menu__item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: #303133;
}

.ctx-menu__item:hover {
  background-color: #f5f7fa;
}

.ctx-menu__item--danger {
  color: #f56c6c;
}

.ctx-menu__item--danger:hover {
  background-color: #fef0f0;
}

:deep(.el-table .disabled-row) {
  color: #c0c4cc;
}

:deep(.el-form-item__label) {
  white-space: nowrap;
}

@media (max-width: 900px) {
  .lab-page {
    flex-direction: column;
  }

  .lab-card {
    width: 100%;
  }
}
</style>