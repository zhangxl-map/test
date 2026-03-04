import { useState, useRef, useCallback } from 'react'
import { Tabs, Modal, Tooltip } from 'antd'
import {
  BarChartOutlined,
  TableOutlined,
  FullscreenOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons'
import ChartRenderer, { type ChartRendererHandle } from './ChartRenderer'
import DataTable from './DataTable'
import { useChatStore } from '../../stores/chatStore'
import './ChartPanel.css'

export default function ChartPanel() {
  const currentChart = useChatStore((s) => s.currentChart)
  const [activeTab, setActiveTab] = useState('chart')
  const [fullscreen, setFullscreen] = useState(false)
  const chartRef = useRef<ChartRendererHandle>(null)
  const fullscreenChartRef = useRef<ChartRendererHandle>(null)

  const handleDownloadPNG = useCallback(() => {
    const ref = fullscreen ? fullscreenChartRef : chartRef
    const url = ref.current?.getDataURL()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `chart-${Date.now()}.png`
    a.click()
  }, [fullscreen])

  const handleDownloadCSV = useCallback(() => {
    if (!currentChart?.table) return
    const { columns, data } = currentChart.table
    const header = columns.map((c) => c.title).join(',')
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = row[c.dataIndex]
        const str = String(val ?? '')
        return str.includes(',') || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(','),
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [currentChart])

  if (!currentChart) return null

  const hasTable = currentChart.table?.columns && currentChart.table?.data
  const chartTitle = currentChart.title || '图表'

  const tabItems = [
    {
      key: 'chart',
      label: (
        <span>
          <BarChartOutlined /> 图表视图
        </span>
      ),
      children: (
        <div className="chart-renderer-wrapper">
          <ChartRenderer ref={chartRef} option={currentChart.option} />
        </div>
      ),
    },
  ]

  if (hasTable) {
    tabItems.push({
      key: 'table',
      label: (
        <span>
          <TableOutlined /> 数据表格
        </span>
      ),
      children: (
        <DataTable
          columns={currentChart.table!.columns}
          data={currentChart.table!.data}
        />
      ),
    })
  }

  return (
    <div className="chart-panel">
      <div className="chart-panel-header">
        <div className="chart-panel-title">
          <BarChartOutlined />
          {chartTitle}
        </div>
        <div className="chart-panel-actions">
          <Tooltip title="下载 PNG">
            <button className="chart-action-btn" onClick={handleDownloadPNG}>
              <DownloadOutlined />
            </button>
          </Tooltip>
          {hasTable && (
            <Tooltip title="下载 CSV">
              <button className="chart-action-btn" onClick={handleDownloadCSV}>
                <FileExcelOutlined />
              </button>
            </Tooltip>
          )}
          <Tooltip title="全屏查看">
            <button className="chart-action-btn" onClick={() => setFullscreen(true)}>
              <FullscreenOutlined />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="chart-panel-body">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          className="chart-tabs"
          items={tabItems}
        />
      </div>

      <Modal
        open={fullscreen}
        onCancel={() => setFullscreen(false)}
        footer={null}
        width="90vw"
        title={chartTitle}
        className="chart-fullscreen-modal"
        destroyOnClose
      >
        <div className="chart-fullscreen-chart">
          <ChartRenderer
            ref={fullscreenChartRef}
            option={currentChart.option}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      </Modal>
    </div>
  )
}
