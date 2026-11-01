import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

import styles from '@/shared/layout/InviteCode.module.css'

// Código que a equipe usa em "Entrar com código" no cadastro
export default function InviteCode({ code }) {
  const [copied, setCopied] = useState(false)
  const Icon = copied ? Check : Copy

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // Sem permissão de área de transferência: o código continua visível para copiar à mão
    }
  }

  return (
    <div className={styles.invite}>
      <span className={styles.label}>Código de convite</span>

      <div className={styles.row}>
        <code>{code}</code>

        <button
          type="button"
          className={styles.copy}
          onClick={copy}
          aria-label={copied ? 'Código copiado' : 'Copiar código de convite'}
        >
          <Icon size={15} />
        </button>
      </div>

      <small className={styles.hint}>Passe para a equipe entrar na organização.</small>
    </div>
  )
}
