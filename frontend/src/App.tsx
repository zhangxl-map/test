import { useEffect } from 'react'
import { ConfigProvider, theme } from 'antd'
import MainLayout from './components/Layout/MainLayout'
import { useChatStore } from './stores/chatStore'
import { useThemeStore } from './stores/themeStore'

function App() {
  const fetchSessions = useChatStore((s) => s.fetchSessions)
  const isDark = useThemeStore((s) => s.isDark)

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <MainLayout />
    </ConfigProvider>
  )
}

export default App
