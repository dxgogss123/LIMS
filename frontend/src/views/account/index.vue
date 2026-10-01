<template>
  <div class="account-page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="按用户名/姓名搜索"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" :icon="Plus" style="margin-left: auto" @click="openCreate">
          新增账户
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column label="角色" min-width="180">
          <template #default="{ row }">
            <span v-if="row.roles.length <= 1">{{ row.roles[0] || '-' }}</span>
            <template v-else>
              <el-tag v-for="r in row.roles" :key="r" size="small" class="role-tag">{{ r }}</el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'enabled' ? 'success' : 'danger'"
              effect="plain"
              class="status-tag"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openResetPassword(row)">重置密码</el-button>
            <el-button
              link
              type="danger"
              :disabled="row.roles.includes('超级管理员')"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无数据" :image-size="80" />
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

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑账户' : '新增账户'"
      width="560px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="form.id !== null" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-select v-model="form.roles" multiple placeholder="请选择角色" style="width: 100%" @change="onRoleChange">
            <el-option v-for="r in ROLE_OPTIONS" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限配置">
          <div class="permission-config">
            <div class="permission-toolbar">
              <el-input
                v-model="permissionFilterText"
                placeholder="搜索权限名称/编码"
                clearable
              />
              <el-button link type="primary" @click="checkAllPermissions">全选</el-button>
              <el-button link type="primary" @click="invertPermissions">反选</el-button>
            </div>
            <div v-loading="permissionTreeLoading" class="permission-tree">
              <el-tree
                v-if="permissionTree.length"
                ref="permissionTreeRef"
                :data="permissionTree"
                show-checkbox
                node-key="code"
                default-expand-all
                :props="{ label: 'name', children: 'children' }"
                :filter-node-method="filterPermissionNode"
              />
              <el-empty v-else-if="!permissionTreeLoading" description="暂无权限数据" :image-size="60" />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" maxlength="11" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resetDialogVisible" title="重置密码" width="460px">
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-width="90px">
        <el-form-item label="用户名">
          <el-input :model-value="resetTarget.username" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetForm.newPassword" type="password" show-password placeholder="请输入新密码" @input="onNewPasswordInput" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetLoading" @click="handleResetSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, ElTree } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import type { AccountItem, AccountPayload, AccountStatus, PermissionNode, Role } from '@/api/account'
import {
  ROLE_OPTIONS,
  createAccount,
  deleteAccount,
  getAccountList,
  getAccountPermissions,
  getPermissionTree,
  getRolePermissions,
  resetAccountPassword,
  toggleAccountStatus,
  updateAccount,
} from '@/api/account'

interface AccountForm {
  id: number | null
  username: string
  name: string
  email: string
  phone: string
  roles: Role[]
}

interface ResetForm {
  newPassword: string
  confirmPassword: string
}

const list = ref<AccountItem[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

const query = reactive({ page: 1, page_size: 10, keyword: '' })

const emptyForm = (): AccountForm => ({
  id: null,
  username: '',
  name: '',
  email: '',
  phone: '',
  roles: [],
})

const form = reactive<AccountForm>(emptyForm())

const rules: FormRules<AccountForm> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '用户名为3-20位字母、数字或下划线', trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  roles: [
    { required: true, type: 'array', min: 1, message: '请选择角色', trigger: 'change' },
  ],
}

const permissionTree = ref<PermissionNode[]>([])
const permissionTreeLoading = ref(false)
const permissionFilterText = ref('')
const permissionTreeRef = ref<InstanceType<typeof ElTree>>()

const allPermissionCodes = computed<string[]>(() => {
  const codes: string[] = []
  const walk = (nodes: PermissionNode[]): void => {
    nodes.forEach((node) => {
      if (node.children && node.children.length) {
        walk(node.children)
      } else {
        codes.push(node.code)
      }
    })
  }
  walk(permissionTree.value)
  return codes
})

const resetDialogVisible = ref(false)
const resetLoading = ref(false)
const resetFormRef = ref<FormInstance>()
const resetForm = reactive<ResetForm>({ newPassword: '', confirmPassword: '' })
const resetTarget = reactive({ id: 0, username: '' })

const resetRules: FormRules<ResetForm> = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (error?: string | Error) => void) => {
        if (value !== resetForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

async function loadList() {
  loading.value = true
  try {
    const result = await getAccountList({
      page: query.page,
      page_size: query.page_size,
      keyword: query.keyword || undefined,
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
  query.page = 1
  loadList()
}

function handleReset() {
  query.keyword = ''
  query.page = 1
  loadList()
}

async function loadPermissionTree() {
  permissionTreeLoading.value = true
  try {
    permissionTree.value = await getPermissionTree()
  } catch {
    ElMessage.error('权限数据加载失败')
  } finally {
    permissionTreeLoading.value = false
  }
}

async function ensurePermissionTree() {
  if (permissionTree.value.length === 0) {
    await loadPermissionTree()
  }
}

async function onRoleChange() {
  if (!form.roles.length) {
    permissionTreeRef.value?.setCheckedKeys([])
    return
  }
  const codes = await getRolePermissions([...form.roles])
  permissionTreeRef.value?.setCheckedKeys(codes)
}

watch(permissionFilterText, (value) => {
  permissionTreeRef.value?.filter(value)
})

function filterPermissionNode(value: string, data: Record<string, string>): boolean {
  if (!value) return true
  const kw = value.toLowerCase()
  return data.name.toLowerCase().includes(kw) || data.code.toLowerCase().includes(kw)
}

function checkAllPermissions() {
  permissionTreeRef.value?.setCheckedKeys(allPermissionCodes.value)
}

function invertPermissions() {
  const checked = permissionTreeRef.value?.getCheckedKeys(true).map((k) => String(k)) ?? []
  const inverted = allPermissionCodes.value.filter((code) => !checked.includes(code))
  permissionTreeRef.value?.setCheckedKeys(inverted)
}

async function openCreate() {
  Object.assign(form, emptyForm())
  formRef.value?.clearValidate()
  permissionFilterText.value = ''
  await ensurePermissionTree()
  dialogVisible.value = true
  await nextTick()
  permissionTreeRef.value?.filter('')
  permissionTreeRef.value?.setCheckedKeys([])
}

async function openEdit(row: AccountItem) {
  Object.assign(form, {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    phone: row.phone,
    roles: [...row.roles],
  })
  formRef.value?.clearValidate()
  permissionFilterText.value = ''
  await ensurePermissionTree()
  dialogVisible.value = true
  await nextTick()
  permissionTreeRef.value?.filter('')
  const codes = await getAccountPermissions(row.id)
  permissionTreeRef.value?.setCheckedKeys(codes)
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const permissionCodes =
    permissionTreeRef.value?.getCheckedKeys(true).map((k) => String(k)) ?? []
  if (permissionCodes.length === 0) {
    ElMessage.warning('未选择任何权限，该账户将仅通过角色继承权限')
  }

  saving.value = true
  const payload: AccountPayload = {
    username: form.username,
    name: form.name,
    email: form.email,
    phone: form.phone,
    roles: form.roles,
    permissionCodes,
  }
  try {
    if (form.id) {
      await updateAccount(form.id, payload)
    } else {
      await createAccount(payload)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadList()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleToggleStatus(row: AccountItem) {
  const next: AccountStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
  const actionText = next === 'enabled' ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定${actionText}账户「${row.username}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await toggleAccountStatus(row.id, next)
    ElMessage.success(`${actionText}成功`)
    loadList()
  } catch {
    ElMessage.error(`${actionText}失败`)
  }
}

function openResetPassword(row: AccountItem) {
  resetTarget.id = row.id
  resetTarget.username = row.username
  resetForm.newPassword = ''
  resetForm.confirmPassword = ''
  resetFormRef.value?.clearValidate()
  resetDialogVisible.value = true
}

function onNewPasswordInput() {
  if (resetForm.confirmPassword) {
    resetFormRef.value?.validateField('confirmPassword')
  }
}

async function handleResetSubmit() {
  if (!resetFormRef.value) return
  const valid = await resetFormRef.value.validate().catch(() => false)
  if (!valid) return
  resetLoading.value = true
  try {
    await resetAccountPassword(resetTarget.id, resetForm.newPassword)
    ElMessage.success('密码已重置')
    resetDialogVisible.value = false
  } catch {
    ElMessage.error('重置失败')
  } finally {
    resetLoading.value = false
  }
}

async function handleDelete(row: AccountItem) {
  if (row.roles.includes('超级管理员')) {
    ElMessage.warning('超级管理员不可删除')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除账户「${row.username}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteAccount(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadList()
  loadPermissionTree()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.role-tag {
  margin-right: 4px;
}

.status-tag {
  cursor: pointer;
}

.permission-config {
  width: 100%;
}

.permission-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.permission-toolbar .el-input {
  flex: 1;
}

.permission-tree {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 4px;
}
</style>