<template>
  <div class="client-page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="按姓名/部门搜索"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" :icon="Plus" style="margin-left: auto" @click="openCreate">
          新增委托人
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="name" label="姓名" width="140" />
        <el-table-column prop="phone" label="联系电话" width="160" />
        <el-table-column prop="department" label="部门" min-width="160" show-overflow-tooltip />
        <el-table-column prop="position" label="职位" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
      :title="form.id ? '编辑委托人' : '新增委托人'"
      width="560px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" maxlength="11" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="form.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="职位" prop="position">
          <el-select
            v-model="form.position"
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入职位"
            style="width: 100%"
          >
            <el-option v-for="p in POSITION_OPTIONS" :key="p" :label="p" :value="p" />
          </el-select>
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import type { ClientItem, ClientPayload } from '@/api/client'
import {
  POSITION_OPTIONS,
  createClient,
  deleteClient,
  getClientList,
  updateClient,
} from '@/api/client'

interface ClientForm {
  id: number | null
  name: string
  phone: string
  department: string
  position: string
}

const list = ref<ClientItem[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

const query = reactive({ page: 1, page_size: 10, keyword: '' })

const emptyForm = (): ClientForm => ({
  id: null,
  name: '',
  phone: '',
  department: '',
  position: POSITION_OPTIONS[0],
})

const form = reactive<ClientForm>(emptyForm())

const rules: FormRules<ClientForm> = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
}

async function loadList() {
  loading.value = true
  try {
    const result = await getClientList({
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

function openCreate() {
  Object.assign(form, emptyForm())
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

function openEdit(row: ClientItem) {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    phone: row.phone,
    department: row.department,
    position: row.position,
  })
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  const payload: ClientPayload = {
    name: form.name,
    phone: form.phone,
    department: form.department,
    position: form.position,
  }
  try {
    if (form.id) {
      await updateClient(form.id, payload)
    } else {
      await createClient(payload)
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

async function handleDelete(row: ClientItem) {
  try {
    await ElMessageBox.confirm(`确定删除委托人「${row.name}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await deleteClient(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(loadList)
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
</style>