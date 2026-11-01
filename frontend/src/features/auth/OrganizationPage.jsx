import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, ChevronRight, KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { createOrganization, joinOrganization, signOut } from '@/features/auth/api/authApi'
import AuthField from '@/features/auth/components/AuthField'
import styles from '@/features/auth/components/AuthForms.module.css'
import AuthLayout from '@/features/auth/components/AuthLayout'
import { organizationsKey, useMyOrganizations, useSession } from '@/features/auth/hooks/useAuth'
import { rememberOrganization } from '@/features/auth/utils/lastOrganization'
import { createOrganizationSchema, joinOrganizationSchema } from '@/features/auth/utils/schemas'
import { zodResolver } from '@/shared/lib/zodResolver'

const modes = {
  create: {
    label: 'Criar organização',
    schema: createOrganizationSchema,
    field: { name: 'name', label: 'Nome da empresa', icon: Building2 },
    hint: 'Você será o administrador e poderá convidar a equipe com um código.',
    submit: 'Criar e continuar',
    action: ({ name }) => createOrganization(name),
  },
  join: {
    label: 'Entrar com código',
    schema: joinOrganizationSchema,
    field: { name: 'code', label: 'Código da organização', icon: KeyRound },
    hint: 'Peça o código ao administrador. Você entra como stakeholder (só leitura).',
    submit: 'Entrar na organização',
    action: ({ code }) => joinOrganization(code),
  },
}

function OrganizationForm({ mode, onDone }) {
  const { schema, field, hint, submit, action } = modes[mode]
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { [field.name]: '' } })

  async function onSubmit(values) {
    try {
      const organizationId = await action(values)
      await onDone(organizationId)
    } catch (error) {
      setError('root', { message: error.message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <AuthField
        id={field.name}
        label={field.label}
        icon={field.icon}
        autoComplete="off"
        error={errors[field.name]}
        {...register(field.name)}
      />

      <p className={styles.hint}>{hint}</p>

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
        {isSubmitting ? 'Aguarde…' : submit}
        <ChevronRight size={17} />
      </button>
    </form>
  )
}

export default function OrganizationPage() {
  const session = useSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [mode, setMode] = useState('create')
  // Quem já tem empresa chegou por "Adicionar empresa" e pode voltar
  const { data: organizations = [] } = useMyOrganizations()

  if (session === null) {
    return <Navigate to="/login" replace />
  }

  // A empresa criada ou a que acabou de entrar passa a ser a escolhida (regra A5)
  async function handleDone(organizationId) {
    rememberOrganization(session.user.id, organizationId)
    await queryClient.invalidateQueries({ queryKey: organizationsKey })
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthLayout
      kicker="ORGANIZAÇÃO"
      title="Onde você trabalha?"
      subtitle="Crie a organização da sua empresa ou entre numa que já existe."
    >
      <div className={styles.choice}>
        {Object.entries(modes).map(([key, { label }]) => (
          <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* key: cada modo tem o próprio formulário, sem herdar valores ou erros do outro */}
      <OrganizationForm key={mode} mode={mode} onDone={handleDone} />

      {organizations.length > 0 && (
        <p className={styles.footer}>
          <Link to="/dashboard">Voltar para o painel</Link>
        </p>
      )}

      <p className={styles.footer}>
        Entrou com a conta errada?{' '}
        <button type="button" className={styles.linkButton} onClick={() => signOut()}>
          Sair
        </button>
      </p>
    </AuthLayout>
  )
}
