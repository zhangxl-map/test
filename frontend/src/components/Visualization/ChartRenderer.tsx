import { forwardRef, useImperativeHandle, useRef } from 'react'
import ReactECharts from 'echarts-for-react'

interface ChartRendererProps {
  option: Record<string, unknown>
  style?: React.CSSProperties
}

export interface ChartRendererHandle {
  getDataURL: () => string | null
}

const ChartRenderer = forwardRef<ChartRendererHandle, ChartRendererProps>(
  ({ option, style }, ref) => {
    const chartRef = useRef<ReactECharts>(null)

    useImperativeHandle(ref, () => ({
      getDataURL: () => {
        const instance = chartRef.current?.getEchartsInstance()
        if (!instance) return null
        return instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' })
      },
    }))

    return (
      <ReactECharts
        ref={chartRef}
        option={option}
        style={style ?? { height: '100%', minHeight: 260 }}
        opts={{ renderer: 'svg' }}
        notMerge
        lazyUpdate
      />
    )
  },
)

ChartRenderer.displayName = 'ChartRenderer'

export default ChartRenderer
