export interface Session {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  sql_query?: string
  chart_data?: string
  created_at: string
}

export interface ChartConfig {
  chart_type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table'
  title?: string
  option: Record<string, unknown>
  table?: {
    columns: { title: string; dataIndex: string; key: string }[]
    data: Record<string, unknown>[]
  }
}

export interface ChatRequest {
  session_id: string
  message: string
}

export type SSEEventType = 'text' | 'sql' | 'chart' | 'done' | 'error'

export interface SSEEvent {
  event: SSEEventType
  data: Record<string, unknown>
}
