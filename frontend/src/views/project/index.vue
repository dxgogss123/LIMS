<template>
  <div class="project-page">
    <el-card>
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="按名称/客户搜索"
          clearable
          style="width: 240px"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" style="margin-left: auto" @click="openCreate">
          新增项目
        </el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="project_no" label="项目编号" width="140" />
        <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="client" label="客户" min-width="140" show-overflow-tooltip />
        <el-table-column prop="method_std" label="方法标准" min-width="140" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type">{{ statusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
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
      :title="form.id ? '编辑项目' : '新增项目'"
      width="560px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="客户">
          <el-input v-model="form.client" />
        </el-form-item>
        <el-form-item label="方法标准">
          <el-input v-model="form.method_std" />
        </el-form-item>
        <el-form-item v-if="form.id" label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option
              v-for="(meta, val) in STATUS_MAP"
              :key="val"
              :label="meta.label"
              :value="val"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="form.start_date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="form.end_date"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
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
import http from '@/api/http'

type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger'

interface Project {
  id: number
  project_no: string
  name: string
  client: string | null
  method_std: string | null
  status: string
  start_date: string | null
  end_date: string | null
  remark: string | null
  created_at: string
}

interface ProjectForm {
  id: number | null
  name: string
  client: string
  method_std: string
  status: string
  start_date: string
  end_date: string
  remark: string
}

const STATUS_MAP: Record<string, { label: string; type: TagType }> = {
  draft: { label: '草稿', type: 'info' },
  in_progress: { label: '进行中', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  archived: { label: '已归档', type: 'warning' },
}

const list = ref<Project[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()

const query = reactive({ page: 1, page_size: 10, keyword: '' })

const emptyForm = (): ProjectForm => ({
  id: null,
  name: '',
  client: '',
  method_std: '',
  status: 'draft',
  start_date: '',
  end_date: '',
  remark: '',
})

const form = reactive<ProjectForm>(emptyForm())

const rules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
}

function statusMeta(status: string): { label: string; type: TagType } {
  return STATUS_MAP[status] || { label: status, type: 'info' }
}

function formatDate(iso: string): string {
  if (!iso) return ''
  return iso.replace('T', ' ').slice(0, 19)
}

async function loadList() {
  loading.value = true
  try {
    const { data } = await http.get('/api/projects', { params: query })
    if (data.code === 0) {
      list.value = data.data.items
      total.value = data.data.total
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || '加载失败')
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
  dialogVisible.value = true
}

function openEdit(row: Project) {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    client: row.client || '',
    method_std: row.method_std || '',
    status: row.status,
    start_date: row.start_date || '',
    end_date: row.end_date || '',
    remark: row.remark || '',
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  const payload = {
    name: form.name,
    client: form.client || null,
    method_std: form.method_std || null,
    start_date: form.start_date || null,
    end_date: form.end_date || null,
    remark: form.remark || null,
  }
  try {
    if (form.id) {
      await http.put(`/api/projects/${form.id}`, { ...payload, status: form.status })
    } else {
      await http.post('/api/projects', payload)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: Project) {
  try {
    await ElMessageBox.confirm(`确定删除项目「${row.name}」吗？`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await http.delete(`/api/projects/${row.id}`)
    ElMessage.success('删除成功')
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || '删除失败')
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