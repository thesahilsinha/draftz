'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'noir' | 'light' | 'colorful'

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'noir', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('noir')

  useEffect(() => {
    const saved = localStorage.getItem('draftz-theme') as ThemeMode
    if (saved) { setThemeState(saved); document.documentElement.setAttribute('data-theme', saved) }
  }, [])

  const setTheme = (t: ThemeMode) => {
    setThemeState(t)
    localStorage.setItem('draftz-theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)