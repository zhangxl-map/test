import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { useChatStore } from '../../stores/chatStore'
import './ChatPanel.css'

export default function ChatPanel() {
  const currentSessionId = useChatStore((s) => s.currentSessionId)

  if (!currentSessionId) {
    return (
      <div className="chat-panel-empty">
        <div className="chat-panel-empty-icon">💬</div>
        <div className="chat-panel-empty-text">选择或新建一个会话开始对话</div>
      </div>
    )
  }

  return (
    <div className="chat-panel">
      <div className="chat-area">
        <MessageList />
      </div>
      <div className="input-area">
        <MessageInput />
      </div>
    </div>
  )
}
