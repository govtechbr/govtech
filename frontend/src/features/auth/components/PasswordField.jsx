import { forwardRef, useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'

import AuthField from '@/features/auth/components/AuthField'

const PasswordField = forwardRef(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false)
  const ToggleIcon = visible ? EyeOff : Eye

  return (
    <AuthField
      icon={LockKeyhole}
      type={visible ? 'text' : 'password'}
      action={
        <button
          type="button"
          className="input-action"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible(!visible)}
        >
          <ToggleIcon size={17} />
        </button>
      }
      {...props}
      ref={ref}
    />
  )
})

export default PasswordField
