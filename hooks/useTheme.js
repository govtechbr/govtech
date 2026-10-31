import { useEffect } from 'react'

export function useTheme(theme) {
  useEffect(() => {
    const root = document.documentElement

    if (theme === 'Escuro') {
      root.dataset.theme = 'dark'
      return
    }

    if (theme === 'Claro') {
      root.dataset.theme = 'light'
      return
    }

    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches

    root.dataset.theme = prefersDark ? 'dark' : 'light'
  }, [theme])
}