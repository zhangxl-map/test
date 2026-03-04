import { useState } from 'react'
import { Layout, Typography } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons'
import SessionList from '../Chat/SessionList'
import ChatPanel from '../Chat/ChatPanel'
import ChartPanel from '../Visualization/ChartPanel'
import { useChatStore } from '../../stores/chatStore'
import { useThemeStore } from '../../stores/themeStore'
import './MainLayout.css'

const { Header, Sider, Content } = Layout

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const currentChart = useChatStore((s) => s.currentChart)
  const isDark = useThemeStore((s) => s.isDark)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  return (
    <Layout className="main-layout">
      <Sider
        width={260}
        collapsedWidth={0}
        collapsed={collapsed}
        className="main-sider"
        trigger={null}
      >
        <SessionList />
      </Sider>
      <Layout>
        <Header className="main-header">
          <div className="header-left">
            <button
              className="collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>
          </div>
          <div className="header-title">
            <BarChartOutlined style={{ marginRight: 8 }} />
            <Typography.Text strong style={{ fontSize: 16, color: '#fff' }}>
              智能数据分析助理
            </Typography.Text>
          </div>
          <div className="header-right">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </button>
          </div>
        </Header>
        <Content className="main-content">
          <div className="main-chat-col">
            <ChatPanel />
          </div>
          {currentChart && (
            <div className="main-chart-col">
              <ChartPanel />
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  )
}
