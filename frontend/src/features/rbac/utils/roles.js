import { BriefcaseBusiness, Code2, Shield } from 'lucide-react'

// O que cada papel realmente pode fazer hoje (regras do banco, core_schema)
export const ROLES = {
  admin: {
    label: 'Admin',
    icon: Shield,
    description: 'Administra a organização e a equipe.',
    permissions: [
      'Ver o painel e os projetos',
      'Criar, editar e excluir projetos',
      'Mudar o papel e remover membros',
      'Ver e gerar o código de convite',
    ],
  },
  developer: {
    label: 'Developer',
    icon: Code2,
    description: 'Mantém os projetos em dia.',
    permissions: ['Ver o painel e os projetos', 'Criar e editar projetos'],
  },
  stakeholder: {
    label: 'Stakeholder',
    icon: BriefcaseBusiness,
    description: 'Acompanha prazos e andamento. Papel de quem entra pelo código.',
    permissions: ['Ver o painel e os projetos (somente leitura)'],
  },
}
