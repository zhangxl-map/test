import { create } from 'zustand'
import type { Session, Message, ChartConfig } from '../types'
import {
  getSessions,
  createSession as apiCreateSession,
  deleteSession as apiDeleteSession,
  getMessages,
  sendChatSSE,
  getTables,
  uploadDatabase,
  renameSession as apiRenameSession,
  type TableInfo,
} from '../services/api'

interface ChatStore {
  sessions: Session[]
  currentSessionId: string | null
  messages: Message[]
  isStreaming: boolean
  currentChart: ChartConfig | null
  loading: boolean
  tables: TableInfo[]

  fetchSessions: () => Promise<void>
  createSession: () => Promise<void>
  switchSession: (id: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  renameSession: (id: string, title: string) => Promise<void>
  sendMessage: (content: string) => void
  addMessage: (msg: Message) => void
  appendToLastMessage: (text: string) => void
  setChart: (chart: ChartConfig | null) => void
  setStreaming: (val: boolean) => void
  fetchTables: () => Promise<void>
  uploadDB: (file: File) => Promise<boolean>
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  isStreaming: false,
  currentChart: null,
  loading: false,
  tables: [],

  fetchSessions: async () => {
    try {
      const sessions = await getSessions()
      set({ sessions })
      if (sessions.length > 0 && !get().currentSessionId) {
        await get().switchSession(sessions[0].id)
      }
    } catch (e) {
      console.error('Failed to fetch sessions:', e)
    }
  },

  createSession: async () => {
    try {
      const session = await apiCreateSession('新会话')
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSessionId: session.id,
        messages: [],
        currentChart: null,
      }))
    } catch (e) {
      console.error('Failed to create session:', e)
    }
  },

  switchSession: async (id: string) => {
    set({ currentSessionId: id, loading: true, currentChart: null })
    try {
      const messages = await getMessages(id)
      set({ messages, loading: false })

      const lastAiMsg = [...messages].reverse().find(
        (m) => m.role === 'assistant' && m.chart_data,
      )
      if (lastAiMsg?.chart_data) {
        try {
          const chart = JSON.parse(lastAiMsg.chart_data) as ChartConfig
          set({ currentChart: chart })
        } catch {
          // invalid chart JSON, ignore
        }
      }
    } catch (e) {
      console.error('Failed to load messages:', e)
      set({ messages: [], loading: false })
    }
  },

  deleteSession: async (id: string) => {
    try {
      await apiDeleteSession(id)
      const sessions = get().sessions.filter((s) => s.id !== id)
      const needSwitch = get().currentSessionId === id
      set({ sessions })

      if (needSwitch) {
        if (sessions.length > 0) {
          await get().switchSession(sessions[0].id)
        } else {
          set({ currentSessionId: null, messages: [], currentChart: null })
        }
      }
    } catch (e) {
      console.error('Failed to delete session:', e)
    }
  },

  renameSession: async (id: string, title: string) => {
    try {
      await apiRenameSession(id, title)
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, title } : s,
        ),
      }))
    } catch (e) {
      console.error('Failed to rename session:', e)
    }
  },

  addMessage: (msg: Message) => {
    set((state) => ({ messages: [...state.messages, msg] }))
  },

  appendToLastMessage: (text: string) => {
    set((state) => {
      const messages = [...state.messages]
      const last = messages[messages.length - 1]
      if (last) {
        messages[messages.length - 1] = { ...last, content: last.content + text }
      }
      return { messages }
    })
  },

  setChart: (chart: ChartConfig | null) => {
    set({ currentChart: chart })
  },

  setStreaming: (val: boolean) => {
    set({ isStreaming: val })
  },

  fetchTables: async () => {
    try {
      const tables = await getTables()
      set({ tables })
    } catch (e) {
      console.error('Failed to fetch tables:', e)
    }
  },

  uploadDB: async (file: File) => {
    try {
      const result = await uploadDatabase(file)
      if (result.success) {
        await get().fetchTables()
        return true
      }
      return false
    } catch (e) {
      console.error('Failed to upload database:', e)
      return false
    }
  },

  sendMessage: (content: string) => {
    const { currentSessionId, addMessage, appendToLastMessage, setStreaming, setChart } = get()
    if (!currentSessionId) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      session_id: currentSessionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    addMessage(userMsg)

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      session_id: currentSessionId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    }
    addMessage(aiMsg)
    setStreaming(true)
    setChart(null)

    sendChatSSE(currentSessionId, content, {
      onText: (ch) => appendToLastMessage(ch),
      onSQL: (sql) => {
        set((state) => {
          const messages = [...state.messages]
          const last = messages[messages.length - 1]
          if (last) {
            messages[messages.length - 1] = { ...last, sql_query: sql }
          }
          return { messages }
        })
      },
      onChart: (chart) => setChart(chart),
      onError: (err) => appendToLastMessage(`\n\n[Error] ${err}`),
      onDone: () => {
        setStreaming(false)
        get().fetchSessions()
      },
    })
  },
}))
