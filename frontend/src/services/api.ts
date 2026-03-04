import axios from 'axios'
import type { Session, Message, ChartConfig } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// ---------- Health ----------

export async function checkHealth(): Promise<{ status: string }> {
  const { data } = await api.get('/health')
  return data
}

// ---------- Session CRUD ----------

export async function getSessions(): Promise<Session[]> {
  const { data } = await api.get<{ sessions: Session[] }>('/sessions')
  return data.sessions
}

export async function createSession(title = '新会话'): Promise<Session> {
  const { data } = await api.post<Session>('/sessions', { title })
  return data
}

export async function deleteSession(id: string): Promise<void> {
  await api.delete(`/sessions/${id}`)
}

export async function renameSession(id: string, title: string): Promise<void> {
  await api.patch(`/sessions/${id}`, { title })
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const { data } = await api.get<{ messages: Message[] }>(
    `/sessions/${sessionId}/messages`,
  )
  return data.messages
}

// ---------- Database ----------

export interface TableInfo {
  name: string
  columns: { name: string; type: string; notnull: boolean; pk: boolean }[]
  row_count: number
}

export async function getTables(): Promise<TableInfo[]> {
  const { data } = await api.get<{ tables: TableInfo[] }>('/database/tables')
  return data.tables
}

export async function uploadDatabase(file: File): Promise<{ success: boolean; message: string }> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/database/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return data
}

// ---------- Chat SSE ----------

export interface SSECallbacks {
  onText?: (content: string) => void
  onSQL?: (sql: string) => void
  onChart?: (chart: ChartConfig) => void
  onError?: (error: string) => void
  onDone?: () => void
}

export async function sendChatSSE(
  sessionId: string,
  message: string,
  callbacks: SSECallbacks,
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  })

  if (!response.ok || !response.body) {
    callbacks.onError?.(`HTTP ${response.status}`)
    callbacks.onDone?.()
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let doneEmitted = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    let currentEvent = ''
    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        const raw = line.slice(5).trim()
        try {
          const payload = JSON.parse(raw)
          switch (currentEvent) {
            case 'text':
              callbacks.onText?.(payload.content)
              break
            case 'sql':
              callbacks.onSQL?.(payload.sql)
              break
            case 'chart':
              callbacks.onChart?.(payload as ChartConfig)
              break
            case 'error':
              callbacks.onError?.(payload.error)
              break
            case 'done':
              if (!doneEmitted) {
                doneEmitted = true
                callbacks.onDone?.()
              }
              break
          }
        } catch {
          // skip malformed JSON lines
        }
        currentEvent = ''
      }
    }
  }

  if (!doneEmitted) {
    callbacks.onDone?.()
  }
}

export default api
