import { useState, useEffect, type KeyboardEvent } from 'react'
import { Button, Typography, Popconfirm, Upload, Input, message } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  DatabaseOutlined,
  UploadOutlined,
  TableOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useChatStore } from '../../stores/chatStore'
import './SessionList.css'

export default function SessionList() {
  const {
    sessions,
    currentSessionId,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
    tables,
    fetchTables,
    uploadDB,
  } = useChatStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${h}:${m}`
  }

  const startEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditValue(title)
  }

  const confirmEdit = async () => {
    if (editingId && editValue.trim()) {
      await renameSession(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      confirmEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const handleUpload = async (file: File) => {
    const ok = await uploadDB(file)
    if (ok) {
      message.success('数据库上传成功')
    } else {
      message.error('数据库上传失败')
    }
    return false
  }

  return (
    <div className="session-list">
      <div className="session-list-header">
        <Typography.Text strong style={{ fontSize: 15 }}>
          会话列表
        </Typography.Text>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={createSession}
        >
          新建
        </Button>
      </div>
      <div className="session-list-items">
        {sessions.length === 0 && (
          <div className="session-empty">暂无会话，点击上方新建</div>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session-item ${session.id === currentSessionId ? 'session-item-active' : ''}`}
            onClick={() => switchSession(session.id)}
          >
            <div className="session-item-icon">
              <MessageOutlined />
            </div>
            {editingId === session.id ? (
              <div className="session-title-input" onClick={(e) => e.stopPropagation()}>
                <Input
                  size="small"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={confirmEdit}
                  autoFocus
                />
              </div>
            ) : (
              <div className="session-item-info">
                <div
                  className="session-item-title"
                  onDoubleClick={(e) => startEditing(session.id, session.title, e)}
                >
                  {session.title}
                </div>
                <div className="session-item-time">
                  {formatTime(session.updated_at)}
                </div>
              </div>
            )}
            <div className="session-item-actions">
              {editingId === session.id ? (
                <>
                  <button
                    className="session-item-btn"
                    onClick={(e) => { e.stopPropagation(); confirmEdit() }}
                  >
                    <CheckOutlined />
                  </button>
                  <button
                    className="session-item-btn"
                    onClick={(e) => { e.stopPropagation(); cancelEdit() }}
                  >
                    <CloseOutlined />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="session-item-btn"
                    onClick={(e) => startEditing(session.id, session.title, e)}
                  >
                    <EditOutlined />
                  </button>
                  <Popconfirm
                    title="确定删除此会话？"
                    onConfirm={(e) => {
                      e?.stopPropagation()
                      deleteSession(session.id)
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                    okText="删除"
                    cancelText="取消"
                    placement="right"
                  >
                    <button
                      className="session-item-btn delete-btn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Database Section */}
      <div className="db-section">
        <div className="db-section-header">
          <span className="db-section-title">
            <DatabaseOutlined /> 数据库
          </span>
          <Upload
            accept=".db"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <Button size="small" icon={<UploadOutlined />}>
              上传
            </Button>
          </Upload>
        </div>
        {tables.length > 0 ? (
          <div className="db-table-list">
            {tables.map((t) => (
              <div key={t.name} className="db-table-item">
                <span className="db-table-name">
                  <TableOutlined style={{ marginRight: 4 }} />
                  {t.name}
                </span>
                <span className="db-table-rows">{t.row_count} 行</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="db-empty">暂无数据表</div>
        )}
      </div>
    </div>
  )
}
