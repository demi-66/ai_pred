<template>
  <div class="forecast-page">
    <!-- 筛选区 -->
    <div class="card">
      <div class="filter-row">
        <div class="filter-item">
          <label>大区经理</label>
          <input v-model="filters.regionalManager" class="filter-input" placeholder="输入大区经理" />
        </div>
        <div class="filter-item">
          <label>仓库</label>
          <input v-model="filters.warehouse" class="filter-input" placeholder="输入仓库" />
        </div>
        <div class="filter-item date-range-item">
          <label>预测日期范围 <span class="date-hint">(最多15天)</span></label>
          <div class="date-range">
            <input type="date" v-model="filters.startDate" class="filter-input" @change="validateDateRange" />
            <span>至</span>
            <input type="date" v-model="filters.endDate" class="filter-input" @change="validateDateRange" />
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" @click="handleQuery" :disabled="loading">
            {{ loading ? '加载中...' : '查询' }}
          </button>
          <button class="btn btn-secondary" @click="handleReset">重置</button>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="card">
      <div class="section-title">未来送货量预测趋势</div>
      <div class="chart-container" v-if="!loading && chartDates.length > 0">
        <div class="chart-wrapper">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>
      <div v-else-if="loading" class="loading-placeholder">加载中...</div>
      <div v-else class="loading-placeholder">暂无数据</div>
    </div>

    <!-- 明细数据区 -->
    <div class="card">
      <div class="table-header">
        <div class="section-title">预测明细数据</div>
        <button class="btn btn-secondary" @click="exportExcel" :disabled="loading">导出Excel</button>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>预测日期</th>
              <th>预测重量(吨)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in paginatedData" :key="idx">
              <td>{{ row.date }}</td>
              <td>{{ parseFloat(row.weight).toFixed(2) }}</td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td :colspan="2" class="empty-data">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
        <select v-model="pageSize" @change="currentPage = 1">
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="50">50条/页</option>
        </select>
      </div>
    </div>
  </div>
/div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

// ==================== 类型定义 ====================
interface ChartData {
  dates: string[]
  total_by_date: string[]
  by_regional_manager?: Array<{
    regional_manager: string
    totals: string[]
  }>
}

// ==================== 状态 ====================
const loading = ref(false)
const chartData = ref<ChartData | null>(null)
const chartCanvas = ref<HTMLCanvasElement>()

// 筛选条件
const todayStr = new Date().toISOString().slice(0, 10)
const getFutureDate = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const filters = ref({
  regionalManager: '',
  warehouse: '',
  startDate: todayStr,
  endDate: getFutureDate(14)
})

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = computed(() => Math.max(1, Math.ceil((chartData.value?.dates.length || 0) / pageSize.value)))
const paginatedData = computed(() => {
  if (!chartData.value) return []
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return chartData.value.dates.slice(start, end).map((date, idx) => ({
    date,
    weight: chartData.value!.total_by_date[start + idx] || '0'
  }))
})

// 图表数据
const chartDates = computed(() => chartData.value?.dates || [])
const chartValues = computed(() => chartData.value?.total_by_date.map(v => parseFloat(v)) || [])

// ==================== 验证日期范围 ====================
function validateDateRange() {
  const start = new Date(filters.value.startDate)
  const end = new Date(filters.value.endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  
  if (days > 14) {
    alert('日期范围最多可选15天（含当天）')
    filters.value.endDate = getFutureDate(14)
  }
  if (start > end) {
    alert('开始日期不能晚于结束日期')
    filters.value.startDate = todayStr
    filters.value.endDate = getFutureDate(14)
  }
}

// ==================== 获取图表数据 ====================
async function fetchChartData() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    
    if (filters.value.startDate) {
      params.date_from = filters.value.startDate
    }
    if (filters.value.endDate) {
      params.date_to = filters.value.endDate
    }
    if (filters.value.regionalManager) {
      params.regional_manager = filters.value.regionalManager
    }
    if (filters.value.warehouse) {
      params.warehouse = filters.value.warehouse
    }
    
    const response = await axios.get('/api/v1/forecast/prd/chart', { params })
    chartData.value = response.data
    setTimeout(() => drawChart(), 100)
  } catch (error) {
    console.error('获取图表数据失败', error)
    chartData.value = null
  } finally {
    loading.value = false
  }
}

// ==================== 查询 ====================
async function queryForecastData() {
  await fetchChartData()
}

function handleQuery() {
  currentPage.value = 1
  queryForecastData()
}

function handleReset() {
  filters.value = {
    regionalManager: '',
    warehouse: '',
    startDate: todayStr,
    endDate: getFutureDate(14)
  }
  queryForecastData()
}

// ==================== 分页 ====================
function prevPage() { if (currentPage.value > 1) currentPage.value-- }
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }

// ==================== 绘制图表 ====================
function drawChart() {
  if (!chartCanvas.value || chartDates.value.length === 0) return
  
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return
  
  const dates = chartDates.value
  const values = chartValues.value
  if (dates.length === 0) return
  
  const container = chartCanvas.value.parentElement
  const containerWidth = container?.clientWidth || 800
  const width = Math.max(containerWidth, 600)
  const height = 400
  
  chartCanvas.value.width = width
  chartCanvas.value.height = height
  
  let maxValue = Math.max(...values, 100)
  maxValue = Math.ceil(maxValue * 1.1)
  
  const margin = { top: 20, right: 40, bottom: 50, left: 60 }
  const chartWidth = width - margin.left - margin.right
  const chartHeight = height - margin.top - margin.bottom
  
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(margin.left, margin.top)
  
  // 坐标轴
  ctx.beginPath()
  ctx.strokeStyle = '#ccc'
  ctx.moveTo(0, 0)
  ctx.lineTo(0, chartHeight)
  ctx.lineTo(chartWidth, chartHeight)
  ctx.stroke()
  
  // Y轴刻度
  const ySteps = 5
  for (let i = 0; i <= ySteps; i++) {
    const y = chartHeight - (i / ySteps) * chartHeight
    const value = (i / ySteps) * maxValue
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(chartWidth, y)
    ctx.strokeStyle = '#eee'
    ctx.stroke()
    ctx.fillStyle = '#666'
    ctx.font = '11px Arial'
    ctx.fillText(Math.round(value).toString(), -35, y + 3)
  }
  
  // X轴
  const xStep = dates.length > 1 ? chartWidth / (dates.length - 1) : chartWidth
  const maxLabels = Math.floor(chartWidth / 70)
  const labelStep = Math.max(1, Math.ceil(dates.length / maxLabels))
  
  dates.forEach((date, i) => {
    const x = i * xStep
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, chartHeight)
    ctx.strokeStyle = '#f0f0f0'
    ctx.stroke()
    
    if (i % labelStep === 0 || i === dates.length - 1) {
      ctx.fillStyle = '#666'
      ctx.font = '11px Arial'
      ctx.fillText(date.slice(5), x - 20, chartHeight + 20)
    }
  })
  
  // 绘制折线
  ctx.beginPath()
  let first = true
  values.forEach((value, i) => {
    const x = i * xStep
    const y = chartHeight - (value / maxValue) * chartHeight
    if (first) {
      ctx.moveTo(x, y)
      first = false
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.strokeStyle = '#4A7A9C'
  ctx.lineWidth = 2
  ctx.stroke()
  
  // 数据点
  values.forEach((value, i) => {
    const x = i * xStep
    const y = chartHeight - (value / maxValue) * chartHeight
    ctx.beginPath()
    ctx.fillStyle = '#4A7A9C'
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fill()
  })
  
  // 标签
  ctx.save()
  ctx.translate(-40, chartHeight / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillStyle = '#666'
  ctx.font = '12px Arial'
  ctx.fillText('重量(吨)', -20, 5)
  ctx.restore()
  
  ctx.fillStyle = '#666'
  ctx.font = '12px Arial'
  ctx.fillText('日期', chartWidth / 2 - 20, chartHeight + 40)
  
  ctx.restore()
}

// ==================== 导出 ====================
async function exportExcel() {
  try {
    const params: Record<string, any> = {}
    
    if (filters.value.startDate) {
      params.date_from = filters.value.startDate
    }
    if (filters.value.endDate) {
      params.date_to = filters.value.endDate
    }
    if (filters.value.regionalManager) {
      params.regional_manager = filters.value.regionalManager
    }
    if (filters.value.warehouse) {
      params.warehouse = filters.value.warehouse
    }
    
    const response = await axios.get('/api/v1/forecast/prd/export', {
      params,
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
    link.href = URL.createObjectURL(blob)
    link.download = `送货量预测_${timestamp}.xlsx`
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('导出失败', error)
    alert('导出失败，请稍后重试')
  }
}

// ==================== 监听窗口大小变化 ====================
const handleResize = () => {
  setTimeout(drawChart, 100)
}

onMounted(() => {
  queryForecastData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.forecast-page { width: 100%; }
.card { background: white; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }

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
  min-width: 160px;
}

.filter-item label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.date-range-item {
  min-width: 280px;
}

.date-hint {
  font-size: 11px;
  color: #909399;
  font-weight: normal;
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
  flex-shrink: 0;
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

.section-title { font-size: 15px; font-weight: 600; color: #1F2D3D; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #E5E9F2; }

.chart-container { min-height: 400px; }
.chart-wrapper { width: 100%; overflow-x: auto; }
.chart-wrapper canvas { min-width: 600px; width: 100%; height: auto; }

.loading-placeholder { min-height: 400px; display: flex; align-items: center; justify-content: center; color: #909399; }

.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.table-wrapper { overflow-x: auto; border: 1px solid #E5E9F2; border-radius: 4px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 10px 12px; text-align: center; border-bottom: 1px solid #E5E9F2; white-space: nowrap; }
.data-table th { background-color: #E8F0F8; font-weight: 600; color: #2c3e50; }
.data-table tbody tr:hover { background-color: #F5F7FA; }
.empty-data { text-align: center; padding: 40px; color: #909399; }

.pagination { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 16px; }
.pagination button { padding: 4px 12px; border: 1px solid #E5E9F2; background: white; border-radius: 4px; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination select { padding: 4px 8px; border: 1px solid #E5E9F2; border-radius: 4px; }
</style>