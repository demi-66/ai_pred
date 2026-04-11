<template>
  <div class="history-query-page">
    <!-- 内页菜单 + 全局搜索 -->
    <div class="card">
      <div class="menu-search-bar">
        <div class="inner-menu">
          <div 
            class="menu-item"
            :class="{ active: activeTab === 'manager' }"
            @click="activeTab = 'manager'"
          >
            按大区经理查询
          </div>
          <div 
            class="menu-item"
            :class="{ active: activeTab === 'warehouse' }"
            @click="activeTab = 'warehouse'"
          >
            按仓库查询
          </div>
        </div>
        <div class="global-search">
          <input v-model="globalSearch" type="text" class="search-input" placeholder="全局搜索" @input="handleGlobalSearch" />
        </div>
      </div>
    </div>

    <!-- ==================== 按大区经理查询 ==================== -->
    <div v-if="activeTab === 'manager'" class="query-section">
      <div class="card">
        <div class="filter-row">
          <div class="filter-item">
            <label>送货日期</label>
            <div class="date-range">
              <input type="date" v-model="managerFilters.startDate" class="filter-input" />
              <span>至</span>
              <input type="date" v-model="managerFilters.endDate" class="filter-input" />
            </div>
          </div>

          <!-- 大区经理多选 -->
          <div class="filter-item multi-select-item">
            <label>大区经理</label>
            <div class="multi-select-container">
              <div class="selected-tags" @click="focusManagerInput">
                <span v-for="item in managerSelectedManagers" :key="item" class="tag">
                  {{ item }}
                  <button type="button" class="tag-remove" @click.stop="removeManager(item)">×</button>
                </span>
                <input 
                  ref="managerInputRef"
                  v-model="managerSearchText"
                  type="text"
                  class="multi-input"
                  placeholder="搜索并选择"
                  @input="filterManagerOptions"
                  @focus="managerDropdownVisible = true"
                  @blur="closeManagerDropdown"
                  @keydown.enter="handleManagerKeydown"
                />
              </div>
              <div v-show="managerDropdownVisible && filteredManagerOptions.length > 0" class="dropdown-list">
                <div 
                  v-for="item in filteredManagerOptions" 
                  :key="item"
                  class="dropdown-item"
                  @click="addManager(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <!-- 冶炼厂多选 -->
          <div class="filter-item multi-select-item">
            <label>冶炼厂</label>
            <div class="multi-select-container">
              <div class="selected-tags" @click="focusSmelterInput">
                <span v-for="item in managerSelectedSmelters" :key="item" class="tag">
                  {{ item }}
                  <button type="button" class="tag-remove" @click.stop="removeSmelter(item)">×</button>
                </span>
                <input 
                  ref="smelterInputRef"
                  v-model="smelterSearchText"
                  type="text"
                  class="multi-input"
                  placeholder="搜索并选择"
                  @input="filterSmelterOptions"
                  @focus="smelterDropdownVisible = true"
                  @blur="closeSmelterDropdown"
                  @keydown.enter="handleSmelterKeydown"
                />
              </div>
              <div v-show="smelterDropdownVisible && filteredSmelterOptions.length > 0" class="dropdown-list">
                <div 
                  v-for="item in filteredSmelterOptions" 
                  :key="item"
                  class="dropdown-item"
                  @click="addSmelter(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-actions">
            <button class="btn btn-primary" @click="queryManagerData" :disabled="loading">查询</button>
            <button class="btn btn-secondary" @click="resetManagerFilters">重置</button>
            <button class="btn btn-danger" :disabled="managerSelectedRows.length === 0" @click="handleManagerBatchDelete">
              批量删除 ({{ managerSelectedRows.length }})
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="result-label">
          <span>有效合同明细（共 {{ managerTotal }} 条）</span>
          <span class="unit-hint">表中数量为车数</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" :checked="isManagerAllSelected" @change="toggleManagerSelectAll" /></th>
                <th>送货日期</th>
                <th>大区经理</th>
                <th>仓库</th>
                <th>品种</th>
                <th>重量(吨)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in managerPaginatedData" :key="row.id">
                <td><input type="checkbox" v-model="managerSelectedRows" :value="row.id" /></td>
                <td>{{ row.delivery_date }}</td>
                <td>{{ row.regional_manager }}</td>
                <td>{{ row.warehouse }}</td>
                <td>{{ row.product_variety }}</td>
                <td>{{ parseFloat(row.weight).toFixed(2) }}</td>
              </tr>
              <tr v-if="managerPaginatedData.length === 0">
                <td :colspan="6" class="empty-data">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button @click="managerCurrentPage--" :disabled="managerCurrentPage === 1">上一页</button>
          <span>第 {{ managerCurrentPage }} / {{ managerTotalPages }} 页</span>
          <button @click="managerCurrentPage++" :disabled="managerCurrentPage === managerTotalPages">下一页</button>
          <select v-model="managerPageSize" @change="managerCurrentPage = 1">
            <option :value="10">10条/页</option>
            <option :value="20">20条/页</option>
            <option :value="50">50条/页</option>
          </select>
        </div>
      </div>
    </div>

    <!-- ==================== 按仓库查询 ==================== -->
    <div v-if="activeTab === 'warehouse'" class="query-section">
      <div class="card">
        <div class="filter-row">
          <div class="filter-item">
            <label>送货日期</label>
            <div class="date-range">
              <input type="date" v-model="warehouseFilters.startDate" class="filter-input" />
              <span>至</span>
              <input type="date" v-model="warehouseFilters.endDate" class="filter-input" />
            </div>
          </div>

          <!-- 仓库多选 -->
          <div class="filter-item multi-select-item">
            <label>仓库</label>
            <div class="multi-select-container">
              <div class="selected-tags" @click="focusWarehouseInput">
                <span v-for="item in warehouseSelectedWarehouses" :key="item" class="tag">
                  {{ item }}
                  <button type="button" class="tag-remove" @click.stop="removeWarehouse(item)">×</button>
                </span>
                <input 
                  ref="warehouseInputRef"
                  v-model="warehouseSearchText"
                  type="text"
                  class="multi-input"
                  placeholder="搜索并选择"
                  @input="filterWarehouseOptions"
                  @focus="warehouseDropdownVisible = true"
                  @blur="closeWarehouseDropdown"
                  @keydown.enter="handleWarehouseKeydown"
                />
              </div>
              <div v-show="warehouseDropdownVisible && filteredWarehouseOptions.length > 0" class="dropdown-list">
                <div 
                  v-for="item in filteredWarehouseOptions" 
                  :key="item"
                  class="dropdown-item"
                  @click="addWarehouse(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <!-- 大区经理多选 -->
          <div class="filter-item multi-select-item">
            <label>大区经理</label>
            <div class="multi-select-container">
              <div class="selected-tags" @click="focusWarehouseManagerInput">
                <span v-for="item in warehouseSelectedManagers" :key="item" class="tag">
                  {{ item }}
                  <button type="button" class="tag-remove" @click.stop="removeWarehouseManager(item)">×</button>
                </span>
                <input 
                  ref="warehouseManagerInputRef"
                  v-model="warehouseManagerSearchText"
                  type="text"
                  class="multi-input"
                  placeholder="搜索并选择"
                  @input="filterWarehouseManagerOptions"
                  @focus="warehouseManagerDropdownVisible = true"
                  @blur="closeWarehouseManagerDropdown"
                  @keydown.enter="handleWarehouseManagerKeydown"
                />
              </div>
              <div v-show="warehouseManagerDropdownVisible && filteredWarehouseManagerOptions.length > 0" class="dropdown-list">
                <div 
                  v-for="item in filteredWarehouseManagerOptions" 
                  :key="item"
                  class="dropdown-item"
                  @click="addWarehouseManager(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <!-- 冶炼厂多选 -->
          <div class="filter-item multi-select-item">
            <label>冶炼厂</label>
            <div class="multi-select-container">
              <div class="selected-tags" @click="focusWarehouseSmelterInput">
                <span v-for="item in warehouseSelectedSmelters" :key="item" class="tag">
                  {{ item }}
                  <button type="button" class="tag-remove" @click.stop="removeWarehouseSmelter(item)">×</button>
                </span>
                <input 
                  ref="warehouseSmelterInputRef"
                  v-model="warehouseSmelterSearchText"
                  type="text"
                  class="multi-input"
                  placeholder="搜索并选择"
                  @input="filterWarehouseSmelterOptions"
                  @focus="warehouseSmelterDropdownVisible = true"
                  @blur="closeWarehouseSmelterDropdown"
                  @keydown.enter="handleWarehouseSmelterKeydown"
                />
              </div>
              <div v-show="warehouseSmelterDropdownVisible && filteredWarehouseSmelterOptions.length > 0" class="dropdown-list">
                <div 
                  v-for="item in filteredWarehouseSmelterOptions" 
                  :key="item"
                  class="dropdown-item"
                  @click="addWarehouseSmelter(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-actions">
            <button class="btn btn-primary" @click="queryWarehouseData" :disabled="loading">查询</button>
            <button class="btn btn-secondary" @click="resetWarehouseFilters">重置</button>
            <button class="btn btn-danger" :disabled="warehouseSelectedRows.length === 0" @click="handleWarehouseBatchDelete">
              批量删除 ({{ warehouseSelectedRows.length }})
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="result-label">
          <span>有效合同明细（共 {{ warehouseTotal }} 条）</span>
          <span class="unit-hint">表中数量为车数</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" :checked="isWarehouseAllSelected" @change="toggleWarehouseSelectAll" /></th>
                <th>送货日期</th>
                <th>大区经理</th>
                <th>仓库</th>
                <th>品种</th>
                <th>重量(吨)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in warehousePaginatedData" :key="row.id">
                <td><input type="checkbox" v-model="warehouseSelectedRows" :value="row.id" /></td>
                <td>{{ row.delivery_date }}</td>
                <td>{{ row.regional_manager }}</td>
                <td>{{ row.warehouse }}</td>
                <td>{{ row.product_variety }}</td>
                <td>{{ parseFloat(row.weight).toFixed(2) }}</td>
              </tr>
              <tr v-if="warehousePaginatedData.length === 0">
                <td :colspan="6" class="empty-data">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button @click="warehouseCurrentPage--" :disabled="warehouseCurrentPage === 1">上一页</button>
          <span>第 {{ warehouseCurrentPage }} / {{ warehouseTotalPages }} 页</span>
          <button @click="warehouseCurrentPage++" :disabled="warehouseCurrentPage === warehouseTotalPages">下一页</button>
          <select v-model="warehousePageSize" @change="warehouseCurrentPage = 1">
            <option :value="10">10条/页</option>
            <option :value="20">20条/页</option>
            <option :value="50">50条/页</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 错误提示弹窗 -->
    <div v-if="errorModalVisible" class="modal" @click.self="closeErrorModal">
      <div class="modal-content modal-small">
        <div class="modal-header error-header">
          <h3>提示</h3>
          <button class="close-btn" @click="closeErrorModal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-message">{{ errorModalMessage }}</p>
          <div v-if="errorModalDetails.length > 0" class="modal-details">
            <ul>
              <li v-for="detail in errorModalDetails" :key="detail">{{ detail }}</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeErrorModal">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

// ==================== 配置 ====================
const API_BASE_URL = 'http://111.229.25.160:8001'

// ==================== 类型定义 ====================
interface HistoryRecord {
  id: number
  delivery_date: string
  regional_manager: string
  warehouse: string
  product_variety: string
  weight: string
  created_at: string
}

interface ApiResponse {
  items: HistoryRecord[]
  total: number
  page: number
  page_size: number
}

// ==================== 通用状态 ====================
const activeTab = ref('manager')
const globalSearch = ref('')
const loading = ref(false)

// 错误弹窗
const errorModalVisible = ref(false)
const errorModalMessage = ref('')
const errorModalDetails = ref<string[]>([])

const showError = (message: string, details?: string[]) => {
  errorModalMessage.value = message
  errorModalDetails.value = details || []
  errorModalVisible.value = true
}

const closeErrorModal = () => {
  errorModalVisible.value = false
  errorModalMessage.value = ''
  errorModalDetails.value = []
}

// 冶炼厂选项
const allSmelterOptions = ['金利', '豫光']

// ==================== 按大区经理查询 ====================
const managerData = ref<HistoryRecord[]>([])
const managerTotal = ref(0)
const managerCurrentPage = ref(1)
const managerPageSize = ref(10)
const managerSelectedRows = ref<number[]>([])

// 大区经理多选
const managerSelectedManagers = ref<string[]>([])
const managerSearchText = ref('')
const managerDropdownVisible = ref(false)
const managerInputRef = ref<HTMLInputElement>()
const allManagerOptions = ref<string[]>([])
const filteredManagerOptions = ref<string[]>([])

// 冶炼厂多选
const managerSelectedSmelters = ref<string[]>([])
const smelterSearchText = ref('')
const smelterDropdownVisible = ref(false)
const smelterInputRef = ref<HTMLInputElement>()
const filteredSmelterOptions = ref<string[]>([])

const managerFilters = ref({
  startDate: '',
  endDate: ''
})

const managerTotalPages = computed(() => Math.max(1, Math.ceil(managerTotal.value / managerPageSize.value)))
const managerPaginatedData = computed(() => managerData.value)

const isManagerAllSelected = computed(() => {
  return managerPaginatedData.value.length > 0 && managerSelectedRows.value.length === managerPaginatedData.value.length
})

// 大区经理多选逻辑
const filterManagerOptions = () => {
  const search = managerSearchText.value.toLowerCase()
  if (search) {
    filteredManagerOptions.value = allManagerOptions.value.filter(opt => opt.toLowerCase().includes(search))
  } else {
    filteredManagerOptions.value = [...allManagerOptions.value]
  }
  managerDropdownVisible.value = filteredManagerOptions.value.length > 0
}

const addManager = (item: string) => {
  if (!managerSelectedManagers.value.includes(item)) {
    managerSelectedManagers.value.push(item)
  }
  managerSearchText.value = ''
  filterManagerOptions()
}

const removeManager = (item: string) => {
  managerSelectedManagers.value = managerSelectedManagers.value.filter(i => i !== item)
}

const handleManagerKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && managerSearchText.value.trim()) {
    addManager(managerSearchText.value.trim())
    e.preventDefault()
  }
}

const closeManagerDropdown = () => {
  setTimeout(() => {
    managerDropdownVisible.value = false
  }, 200)
}

const focusManagerInput = () => {
  managerInputRef.value?.focus()
}

// 冶炼厂多选逻辑
const filterSmelterOptions = () => {
  const search = smelterSearchText.value.toLowerCase()
  if (search) {
    filteredSmelterOptions.value = allSmelterOptions.filter(opt => opt.toLowerCase().includes(search))
  } else {
    filteredSmelterOptions.value = [...allSmelterOptions]
  }
  smelterDropdownVisible.value = filteredSmelterOptions.value.length > 0
}

const addSmelter = (item: string) => {
  if (!managerSelectedSmelters.value.includes(item)) {
    managerSelectedSmelters.value.push(item)
  }
  smelterSearchText.value = ''
  filterSmelterOptions()
}

const removeSmelter = (item: string) => {
  managerSelectedSmelters.value = managerSelectedSmelters.value.filter(i => i !== item)
}

const handleSmelterKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && smelterSearchText.value.trim()) {
    addSmelter(smelterSearchText.value.trim())
    e.preventDefault()
  }
}

const closeSmelterDropdown = () => {
  setTimeout(() => {
    smelterDropdownVisible.value = false
  }, 200)
}

const focusSmelterInput = () => {
  smelterInputRef.value?.focus()
}

// 查询按大区经理数据
async function queryManagerData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: managerCurrentPage.value,
      page_size: managerPageSize.value
    }
    
    if (managerFilters.value.startDate) {
      params.date_from = managerFilters.value.startDate
    }
    if (managerFilters.value.endDate) {
      params.date_to = managerFilters.value.endDate
    }
    if (managerSelectedManagers.value.length > 0) {
      params.regional_managers = managerSelectedManagers.value
    }
    if (managerSelectedSmelters.value.length > 0) {
      params.product_varieties = managerSelectedSmelters.value
    }
    if (globalSearch.value) {
      params.global_search = globalSearch.value
    }
    
    console.log('请求参数:', params)
    
    const response = await axios.get(`${API_BASE_URL}/api/v1/history`, { params })
    const data = response.data as ApiResponse
    
    if (data && data.items) {
      managerData.value = data.items
      managerTotal.value = data.total
      // 更新下拉选项
      allManagerOptions.value = [...new Set(data.items.map(item => item.regional_manager))].filter(Boolean)
      filteredManagerOptions.value = [...allManagerOptions.value]
    } else {
      managerData.value = []
      managerTotal.value = 0
    }
  } catch (error) {
    console.error('查询失败', error)
    showError('查询失败', ['请检查网络连接或稍后重试'])
  } finally {
    loading.value = false
  }
}

function resetManagerFilters() {
  managerFilters.value = {
    startDate: '',
    endDate: ''
  }
  managerSelectedManagers.value = []
  managerSelectedSmelters.value = []
  managerSearchText.value = ''
  smelterSearchText.value = ''
  managerCurrentPage.value = 1
  queryManagerData()
}

function toggleManagerSelectAll() {
  if (isManagerAllSelected.value) {
    managerSelectedRows.value = []
  } else {
    managerSelectedRows.value = managerPaginatedData.value.map(row => row.id)
  }
}

async function handleManagerBatchDelete() {
  if (managerSelectedRows.value.length === 0) return
  if (!confirm(`确认删除选中的${managerSelectedRows.value.length}条记录？此操作不可恢复。`)) return
  
  try {
    await axios.delete(`${API_BASE_URL}/api/v1/history/batch`, {
      data: { ids: managerSelectedRows.value }
    })
    showError(`成功删除${managerSelectedRows.value.length}条数据`, [])
    managerSelectedRows.value = []
    queryManagerData()
  } catch (error: any) {
    console.error('删除失败', error)
    showError('删除失败', [error.response?.data?.message || '请稍后重试'])
  }
}

// ==================== 按仓库查询 ====================
const warehouseData = ref<HistoryRecord[]>([])
const warehouseTotal = ref(0)
const warehouseCurrentPage = ref(1)
const warehousePageSize = ref(10)
const warehouseSelectedRows = ref<number[]>([])

// 仓库多选
const warehouseSelectedWarehouses = ref<string[]>([])
const warehouseSearchText = ref('')
const warehouseDropdownVisible = ref(false)
const warehouseInputRef = ref<HTMLInputElement>()
const allWarehouseOptions = ref<string[]>([])
const filteredWarehouseOptions = ref<string[]>([])

// 大区经理多选
const warehouseSelectedManagers = ref<string[]>([])
const warehouseManagerSearchText = ref('')
const warehouseManagerDropdownVisible = ref(false)
const warehouseManagerInputRef = ref<HTMLInputElement>()
const filteredWarehouseManagerOptions = ref<string[]>([])

// 冶炼厂多选
const warehouseSelectedSmelters = ref<string[]>([])
const warehouseSmelterSearchText = ref('')
const warehouseSmelterDropdownVisible = ref(false)
const warehouseSmelterInputRef = ref<HTMLInputElement>()
const filteredWarehouseSmelterOptions = ref<string[]>([])

const warehouseFilters = ref({
  startDate: '',
  endDate: ''
})

const warehouseTotalPages = computed(() => Math.max(1, Math.ceil(warehouseTotal.value / warehousePageSize.value)))
const warehousePaginatedData = computed(() => warehouseData.value)

const isWarehouseAllSelected = computed(() => {
  return warehousePaginatedData.value.length > 0 && warehouseSelectedRows.value.length === warehousePaginatedData.value.length
})

// 仓库多选逻辑
const filterWarehouseOptions = () => {
  const search = warehouseSearchText.value.toLowerCase()
  if (search) {
    filteredWarehouseOptions.value = allWarehouseOptions.value.filter(opt => opt.toLowerCase().includes(search))
  } else {
    filteredWarehouseOptions.value = [...allWarehouseOptions.value]
  }
  warehouseDropdownVisible.value = filteredWarehouseOptions.value.length > 0
}

const addWarehouse = (item: string) => {
  if (!warehouseSelectedWarehouses.value.includes(item)) {
    warehouseSelectedWarehouses.value.push(item)
  }
  warehouseSearchText.value = ''
  filterWarehouseOptions()
}

const removeWarehouse = (item: string) => {
  warehouseSelectedWarehouses.value = warehouseSelectedWarehouses.value.filter(i => i !== item)
}

const handleWarehouseKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && warehouseSearchText.value.trim()) {
    addWarehouse(warehouseSearchText.value.trim())
    e.preventDefault()
  }
}

const closeWarehouseDropdown = () => {
  setTimeout(() => {
    warehouseDropdownVisible.value = false
  }, 200)
}

const focusWarehouseInput = () => {
  warehouseInputRef.value?.focus()
}

// 大区经理多选逻辑
const filterWarehouseManagerOptions = () => {
  const search = warehouseManagerSearchText.value.toLowerCase()
  if (search) {
    filteredWarehouseManagerOptions.value = allManagerOptions.value.filter(opt => opt.toLowerCase().includes(search))
  } else {
    filteredWarehouseManagerOptions.value = [...allManagerOptions.value]
  }
  warehouseManagerDropdownVisible.value = filteredWarehouseManagerOptions.value.length > 0
}

const addWarehouseManager = (item: string) => {
  if (!warehouseSelectedManagers.value.includes(item)) {
    warehouseSelectedManagers.value.push(item)
  }
  warehouseManagerSearchText.value = ''
  filterWarehouseManagerOptions()
}

const removeWarehouseManager = (item: string) => {
  warehouseSelectedManagers.value = warehouseSelectedManagers.value.filter(i => i !== item)
}

const handleWarehouseManagerKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && warehouseManagerSearchText.value.trim()) {
    addWarehouseManager(warehouseManagerSearchText.value.trim())
    e.preventDefault()
  }
}

const closeWarehouseManagerDropdown = () => {
  setTimeout(() => {
    warehouseManagerDropdownVisible.value = false
  }, 200)
}

const focusWarehouseManagerInput = () => {
  warehouseManagerInputRef.value?.focus()
}

// 冶炼厂多选逻辑
const filterWarehouseSmelterOptions = () => {
  const search = warehouseSmelterSearchText.value.toLowerCase()
  if (search) {
    filteredWarehouseSmelterOptions.value = allSmelterOptions.filter(opt => opt.toLowerCase().includes(search))
  } else {
    filteredWarehouseSmelterOptions.value = [...allSmelterOptions]
  }
  warehouseSmelterDropdownVisible.value = filteredWarehouseSmelterOptions.value.length > 0
}

const addWarehouseSmelter = (item: string) => {
  if (!warehouseSelectedSmelters.value.includes(item)) {
    warehouseSelectedSmelters.value.push(item)
  }
  warehouseSmelterSearchText.value = ''
  filterWarehouseSmelterOptions()
}

const removeWarehouseSmelter = (item: string) => {
  warehouseSelectedSmelters.value = warehouseSelectedSmelters.value.filter(i => i !== item)
}

const handleWarehouseSmelterKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && warehouseSmelterSearchText.value.trim()) {
    addWarehouseSmelter(warehouseSmelterSearchText.value.trim())
    e.preventDefault()
  }
}

const closeWarehouseSmelterDropdown = () => {
  setTimeout(() => {
    warehouseSmelterDropdownVisible.value = false
  }, 200)
}

const focusWarehouseSmelterInput = () => {
  warehouseSmelterInputRef.value?.focus()
}

// 查询按仓库数据
async function queryWarehouseData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: warehouseCurrentPage.value,
      page_size: warehousePageSize.value
    }
    
    if (warehouseFilters.value.startDate) {
      params.date_from = warehouseFilters.value.startDate
    }
    if (warehouseFilters.value.endDate) {
      params.date_to = warehouseFilters.value.endDate
    }
    if (warehouseSelectedWarehouses.value.length > 0) {
      params.warehouses = warehouseSelectedWarehouses.value
    }
    if (warehouseSelectedManagers.value.length > 0) {
      params.regional_managers = warehouseSelectedManagers.value
    }
    if (warehouseSelectedSmelters.value.length > 0) {
      params.product_varieties = warehouseSelectedSmelters.value
    }
    if (globalSearch.value) {
      params.global_search = globalSearch.value
    }
    
    console.log('请求参数:', params)
    
    const response = await axios.get(`${API_BASE_URL}/api/v1/history`, { params })
    const data = response.data as ApiResponse
    
    if (data && data.items) {
      warehouseData.value = data.items
      warehouseTotal.value = data.total
      // 更新下拉选项
      allWarehouseOptions.value = [...new Set(data.items.map(item => item.warehouse))].filter(Boolean)
      filteredWarehouseOptions.value = [...allWarehouseOptions.value]
      allManagerOptions.value = [...new Set(data.items.map(item => item.regional_manager))].filter(Boolean)
      filteredWarehouseManagerOptions.value = [...allManagerOptions.value]
    } else {
      warehouseData.value = []
      warehouseTotal.value = 0
    }
  } catch (error) {
    console.error('查询失败', error)
    showError('查询失败', ['请检查网络连接或稍后重试'])
  } finally {
    loading.value = false
  }
}

function resetWarehouseFilters() {
  warehouseFilters.value = {
    startDate: '',
    endDate: ''
  }
  warehouseSelectedWarehouses.value = []
  warehouseSelectedManagers.value = []
  warehouseSelectedSmelters.value = []
  warehouseSearchText.value = ''
  warehouseManagerSearchText.value = ''
  warehouseSmelterSearchText.value = ''
  warehouseCurrentPage.value = 1
  queryWarehouseData()
}

function toggleWarehouseSelectAll() {
  if (isWarehouseAllSelected.value) {
    warehouseSelectedRows.value = []
  } else {
    warehouseSelectedRows.value = warehousePaginatedData.value.map(row => row.id)
  }
}

async function handleWarehouseBatchDelete() {
  if (warehouseSelectedRows.value.length === 0) return
  if (!confirm(`确认删除选中的${warehouseSelectedRows.value.length}条记录？此操作不可恢复。`)) return
  
  try {
    await axios.delete(`${API_BASE_URL}/api/v1/history/batch`, {
      data: { ids: warehouseSelectedRows.value }
    })
    showError(`成功删除${warehouseSelectedRows.value.length}条数据`, [])
    warehouseSelectedRows.value = []
    queryWarehouseData()
  } catch (error: any) {
    console.error('删除失败', error)
    showError('删除失败', [error.response?.data?.message || '请稍后重试'])
  }
}

function handleGlobalSearch() {
  if (activeTab.value === 'manager') {
    managerCurrentPage.value = 1
    queryManagerData()
  } else {
    warehouseCurrentPage.value = 1
    queryWarehouseData()
  }
}

// 监听分页变化
watch([managerCurrentPage, managerPageSize], () => {
  if (activeTab.value === 'manager') {
    queryManagerData()
  }
})
watch([warehouseCurrentPage, warehousePageSize], () => {
  if (activeTab.value === 'warehouse') {
    queryWarehouseData()
  }
})

onMounted(() => {
  queryManagerData()
  queryWarehouseData()
})
</script>

<style scoped>
.history-query-page { width: 100%; }
.card { background: white; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }

.menu-search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.inner-menu {
  display: flex;
  gap: 8px;
  background: #F5F7FA;
  border-radius: 8px;
  padding: 4px;
}

.menu-item {
  padding: 8px 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
  color: #606266;
}

.menu-item:hover {
  background-color: rgba(74, 122, 156, 0.1);
}

.menu-item.active {
  background-color: #4A7A9C;
  color: white;
}

.global-search {
  flex-shrink: 0;
}

.search-input {
  padding: 6px 12px;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
  width: 200px;
  font-size: 14px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
}

.filter-item label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.date-range {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-input {
  padding: 6px 10px;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
  font-size: 13px;
  width: 130px;
}

.filter-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

/* 多选组件样式 */
.multi-select-item {
  min-width: 180px;
}

.multi-select-container {
  position: relative;
  width: 200px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
  background: white;
  min-height: 32px;
  cursor: text;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background-color: #E8F0F8;
  border-radius: 3px;
  font-size: 12px;
  color: #2c3e50;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #909399;
  padding: 0 2px;
}

.tag-remove:hover {
  color: #f56c6c;
}

.multi-input {
  flex: 1;
  min-width: 60px;
  border: none;
  outline: none;
  padding: 4px 6px;
  font-size: 13px;
  background: transparent;
}

.multi-input::placeholder {
  color: #c0c4cc;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  margin-top: 2px;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  text-align: left;
}

.dropdown-item:hover {
  background-color: #F5F7FA;
  color: #4A7A9C;
}

.btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #4A7A9C;
  color: white;
}
.btn-primary:hover { background-color: #5a8aac; }

.btn-secondary {
  background-color: #F5F7FA;
  color: #606266;
  border: 1px solid #E5E9F2;
}
.btn-secondary:hover { background-color: #E5E9F2; }

.btn-danger {
  background-color: #f56c6c;
  color: white;
}
.btn-danger:hover:not(:disabled) { background-color: #f78989; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.result-label {
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unit-hint {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  text-align: center;
  border-bottom: 1px solid #E5E9F2;
  white-space: nowrap;
}

.data-table th {
  background-color: #E8F0F8;
  font-weight: 600;
  color: #2c3e50;
}

.data-table tbody tr:hover {
  background-color: #F5F7FA;
}

.empty-data {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.pagination button {
  padding: 4px 12px;
  border: 1px solid #E5E9F2;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination select {
  padding: 4px 8px;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 80%;
  overflow: auto;
}

.modal-small {
  width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #E5E9F2;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1F2D3D;
  margin: 0;
}

.error-header {
  background-color: #ffebee;
  border-bottom-color: #ef9a9a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
}

.close-btn:hover {
  color: #606266;
}

.modal-body {
  padding: 20px;
}

.modal-message {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.modal-details {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
}

.modal-details ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #909399;
}

.modal-details li {
  margin: 4px 0;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #E5E9F2;
  text-align: right;
}
</style>