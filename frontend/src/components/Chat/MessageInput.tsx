import { useState, type KeyboardEvent } from 'react'
import { Input, Button, Tooltip } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import { useChatStore } from '../../stores/chatStore'
import './MessageInput.css'

const { TextArea } = Input

export default function MessageInput() {
  const [value, setValue] = useState('')
  const isStreaming = useChatStore((s) => s.isStreaming)
  const sendMessage = useChatStore((s) => s.sendMessage)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    sendMessage(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="message-input">
      <TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入你的问题，如：各产品类别的销售额是多少？"
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={isStreaming}
        className="message-textarea"
      />
      <Tooltip title={isStreaming ? 'AI 正在回复中...' : 'Enter 发送, Shift+Enter 换行'}>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!value.trim() || isStreaming}
          loading={isStreaming}
          className="message-send-btn"
        />
      </Tooltip>
    </div>
  )
}
