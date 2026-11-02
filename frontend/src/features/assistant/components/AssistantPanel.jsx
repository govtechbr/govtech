import { Bot, Send } from 'lucide-react'
import { useRef, useState } from 'react'

import styles from '@/features/assistant/components/AssistantPanel.module.css'
import { useAssistant } from '@/features/assistant/hooks/useAssistant'
import Modal from '@/shared/ui/Modal'

const SUGGESTIONS = [
  'Por que o índice está nessa nota?',
  'O que fazer para subir o índice?',
  'Quais PRs precisam de atenção?',
  'Resuma a governança para a diretoria.',
]

// Assistente de Governança com IA (regras IA1–IA6). `context`: dados da empresa
// montados por shared/lib/assistantContext; null enquanto carregam.
export default function AssistantPanel({ organizationId, context, onClose }) {
  const [question, setQuestion] = useState('')
  const inputRef = useRef(null)
  const { messages, remaining, ask, isPending, error } = useAssistant({ organizationId, context })
  const ready = Boolean(context)

  function send(text) {
    if (!ready) return
    ask(text)
    setQuestion('')
    // a sugestão clicada some: o foco vai para o campo e continua no diálogo
    inputRef.current?.focus()
  }

  function handleSubmit(event) {
    event.preventDefault()
    send(question)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send(question)
    }
  }

  return (
    <Modal
      title="Assistente de Governança"
      kicker="IA · PERGUNTE SOBRE A EMPRESA"
      onClose={onClose}
    >
      <div className={styles.panel}>
        <div className={styles.log} role="log" aria-live="polite" aria-label="Conversa">
          {messages.length === 0 && (
            <p className={styles.intro}>
              <Bot size={18} aria-hidden="true" />
              Pergunte sobre o Índice de Governança, os alertas, os PRs e os prazos dos projetos
              desta empresa.
            </p>
          )}

          {messages.map((message, index) => (
            <p
              key={index}
              className={message.role === 'user' ? styles.user : styles.answer}
              aria-label={message.role === 'user' ? 'Você' : 'Assistente'}
            >
              {message.content}
            </p>
          ))}

          {isPending && <p className={styles.pending}>Analisando os dados…</p>}
          {error && !isPending && (
            <p className={styles.error} role="alert">
              {error.message}
            </p>
          )}
        </div>

        {messages.length === 0 && (
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={styles.suggestion}
                onClick={() => send(suggestion)}
                disabled={!ready || isPending}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.visuallyHidden} htmlFor="assistant-question">
            Sua pergunta
          </label>
          <textarea
            ref={inputRef}
            id="assistant-question"
            className={styles.input}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ready ? 'Digite sua pergunta…' : 'Carregando os dados da empresa…'}
            rows={2}
            maxLength={1000}
            disabled={!ready}
          />
          <button
            type="submit"
            className="primary-button"
            disabled={!ready || isPending || !question.trim()}
            aria-label="Enviar pergunta"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>

        <p className={styles.notice}>
          Respostas geradas por IA (Groq, nos EUA), que não usa os dados para treinar modelos. A
          conversa não é guardada. Confira os números nos painéis.
          {remaining !== null && (
            <strong>
              {' '}
              {remaining === 1 ? 'Resta 1 pergunta' : `Restam ${remaining} perguntas`} hoje.
            </strong>
          )}
        </p>
      </div>
    </Modal>
  )
}
