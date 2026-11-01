import { forwardRef } from 'react'

import styles from '@/features/auth/components/AuthForms.module.css'

// Rótulo + campo + erro. Fica em fragmento para o <label> ser filho direto do
// <form> (é o que o estilo .login-card espera). O ref vem do register do
// react-hook-form, que lê o valor direto do <input>.
const AuthField = forwardRef(function AuthField(
  { id, label, icon: Icon, error, action, ...inputProps },
  ref,
) {
  const errorId = `${id}-error`

  return (
    <>
      <label htmlFor={id}>{label}</label>

      <div className="input-wrap">
        <Icon size={17} aria-hidden="true" />

        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />

        {action}
      </div>

      {error && (
        <p id={errorId} className={styles.fieldError}>
          {error.message}
        </p>
      )}
    </>
  )
})

export default AuthField
