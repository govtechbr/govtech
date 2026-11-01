import { z } from 'zod'

const email = z.string().trim().pipe(z.email('Informe um e-mail válido.'))

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha.'),
})

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe seu nome.').max(120, 'Nome muito longo.'),
  email,
  password: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.'),
})

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da empresa.').max(120, 'Nome muito longo.'),
})

export const joinOrganizationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Informe o código que o administrador passou.')
    .transform((code) => code.toUpperCase()),
})
