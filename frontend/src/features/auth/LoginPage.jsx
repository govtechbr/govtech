import { ChevronRight, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'

import { signIn } from '@/features/auth/api/authApi'
import AuthField from '@/features/auth/components/AuthField'
import styles from '@/features/auth/components/AuthForms.module.css'
import AuthLayout from '@/features/auth/components/AuthLayout'
import PasswordField from '@/features/auth/components/PasswordField'
import { useSession } from '@/features/auth/hooks/useAuth'
import { loginSchema } from '@/features/auth/utils/schemas'
import { zodResolver } from '@/shared/lib/zodResolver'

export default function LoginPage() {
  const session = useSession()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  // Quem já entrou vai direto ao painel (inclusive logo depois do login)
  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(values) {
    try {
      await signIn(values)
    } catch (error) {
      setError('root', { message: error.message })
    }
  }

  return (
    <AuthLayout
      kicker="ACESSO CORPORATIVO"
      title="Bem-vindo de volta"
      subtitle="Acesse a plataforma GovTech MS."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthField
          id="email"
          label="E-mail"
          icon={UserRound}
          type="email"
          autoComplete="email"
          error={errors.email}
          {...register('email')}
        />

        <PasswordField
          id="password"
          label="Senha"
          autoComplete="current-password"
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
          {isSubmitting ? 'Entrando…' : 'Entrar na plataforma'}
          <ChevronRight size={17} />
        </button>
      </form>

      <p className={styles.footer}>
        Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>
    </AuthLayout>
  )
}
