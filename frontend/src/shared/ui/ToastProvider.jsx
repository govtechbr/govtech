import { useCallback, useMemo, useState } from 'react'

import Toast from '@/shared/ui/Toast'
import { ToastContext } from '@/shared/ui/toastContext'

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type })
  }, [])

  const closeToast = useCallback(() => setToast(null), [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div role="status" aria-live="polite">
        {toast && (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={closeToast} />
        )}
      </div>
    </ToastContext.Provider>
  )
}
