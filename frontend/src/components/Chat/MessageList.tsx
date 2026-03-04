import { useEffect, useRef } from 'react'
import { Avatar, Spin } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import { useChatStore } from '../../stores/chatStore'
import './MessageList.css'

export default function MessageList() {
  const messages = useChatStore((s) => s.messages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <RobotOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />
        <p>发送消息开始对话</p>
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message-row ${msg.role === 'user' ? 'message-row-user' : 'message-row-ai'}`}
        >
          <Avatar
            size={36}
            className={`message-avatar ${msg.role === 'user' ? 'avatar-user' : 'avatar-ai'}`}
            icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
          />
          <div
            className={`message-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}
          >
            {msg.role === 'assistant' ? (
              <ReactMarkdown
                components={{
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    if (match) {
                      return (
                        <pre className="code-block">
                          <div className="code-block-header">{match[1].toUpperCase()}</div>
                          <code>{children}</code>
                        </pre>
                      )
                    }
                    return (
                      <code className="inline-code" {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            ) : (
              <span>{msg.content}</span>
            )}
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="streaming-indicator">
          <Spin size="small" />
          <span>AI 正在思考...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
