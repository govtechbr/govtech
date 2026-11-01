import { useState } from 'react'
import { AtSign, ChevronRight, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'

import { signUp } from '@/features/auth/api/authApi'
import AuthField from '@/features/auth/components/AuthField'
import styles from '@/features/auth/components/AuthForms.module.css'
import AuthLayout from '@/features/auth/components/AuthLayout'
import PasswordField from '@/features/auth/components/PasswordField'
import { useSession } from '@/features/auth/hooks/useAuth'
import { signupSchema } from '@/features/auth/utils/schemas'
import { zodResolver } from '@/shared/lib/zodResolver'

export default function SignupPage() {
  const session = useSession()
  const [pendingEmail, setPendingEmail] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  // Com a conta criada e logada, o painel manda para a escolha de organização
  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(values) {
    try {
      const signedIn = await signUp(values)

      if (!signedIn) {
        setPendingEmail(values.email)
      }
    } catch (error) {
      setError('root', { message: error.message })
    }
  }

  return (
    <AuthLayout
      kicker="NOVA CONTA"
      title="Criar conta"
      subtitle="Depois você cria a sua organização ou entra numa existente."
    >
      {pendingEmail ? (
        <p role="status" className={styles.notice}>
          Enviamos um link de confirmação para <strong>{pendingEmail}</strong>. Abra o e-mail para
          ativar a conta e depois entre.
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <AuthField
            id="fullName"
            label="Nome completo"
            icon={UserRound}
            autoComplete="name"
            error={errors.fullName}
            {...register('fullName')}
          />

          <AuthField
            id="email"
            label="E-mail"
            icon={AtSign}
            type="email"
            autoComplete="email"
            error={errors.email}
            {...register('email')}
          />

          <PasswordField
            id="password"
            label="Senha"
            autoComplete="new-password"
            error={errors.password}
            {...register('password')}
          />

          {errors.root && (
            <p role="alert" className={styles.formError}>
              {errors.root.message}
            </p>
          )}

          <button
            className={`primary-button full-width ${styles.submit}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Criando conta…' : 'Criar conta'}
            <ChevronRight size={17} />
          </button>
        </form>
      )}

      <p className={styles.footer}>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthLayout>
  )
}
