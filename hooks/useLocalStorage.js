import { useEffect, useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const savedValue = localStorage.getItem(key)

      if (savedValue) {
        return JSON.parse(savedValue)
      }

      return initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error)
    }
  }, [key, value])

  return [value, setValue]
}