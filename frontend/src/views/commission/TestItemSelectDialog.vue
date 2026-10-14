<template>
  <el-dialog
    :model-value="modelValue"
    title="选择检测项"
    width="720px"
    append-to-body
    destroy-on-close
    @update:model-value="(val: boolean) => emit('update:modelValue', val)"
  >
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="检测项名称/编码"
        clearable
        style="width: 260px"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">查询</el-button>
    </div>

    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="list"
      row-key="id"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" reserve-selection />
      <el-table-column prop="code" label="检测项编码" min-width="140" />
      <el-table-column prop="name" label="检测项名称" min-width="160" />
      <el-table-column prop="standard" label="所属标准" min-width="140" />
      <el-table-column prop="unit" label="单位" min-width="80" />
    </el-table>

    <el-pagination
      class="pager"
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="handlePageChange"
    />

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { TableInstance } from 'element-plus'
import { getTestItemList, type TestItem } from '@/api/test-item'

const props = defineProps<{
  modelValue: boolean
  selectedIds?: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [items: TestItem[]]
}>()

const keyword = ref('')
const page = ref(1)
const pageSize = 10
const total = ref(0)
const list = ref<TestItem[]>([])
const loading = ref(false)
const selectedItems = ref<TestItem[]>([])
const tableRef = ref<TableInstance>()

async function loadList(preSelectExisting = false) {
  loading.value = true
  try {
    const res = await getTestItemList({
      keyword: keyword.value,
      page: page.value,
      pageSize,
    })
    list.value = res.items
    total.value = res.total

    if (preSelectExisting && props.selectedIds?.length) {
      await nextTick()
      list.value.forEach((row) => {
        if (props.selectedIds?.includes(row.id)) {
          tableRef.value?.toggleRowSelection(row, true)
        }
      })
    }
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadList()
}

function handlePageChange(p: number) {
  page.value = p
  loadList()
}

function handleSelectionChange(rows: TestItem[]) {
  selectedItems.value = rows
}

function handleCancel() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  emit('confirm', selectedItems.value)
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      keyword.value = ''
      page.value = 1
      selectedItems.value = []
      loadList(true)
    }
  }
)
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pager {
  margin-top: 12px;
  justify-content: flex-end;
}
</style>