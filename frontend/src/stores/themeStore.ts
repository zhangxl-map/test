import { create } from 'zustand'

interface ThemeStore {
  isDark: boolean
  toggleTheme: () => void
}

const getInitialTheme = (): boolean => {
  try {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: getInitialTheme(),

  toggleTheme: () => {
    const next = !get().isDark
    localStorage.setItem('theme', next ? 'dark' : 'light')
    set({ isDark: next })
  },
}))
