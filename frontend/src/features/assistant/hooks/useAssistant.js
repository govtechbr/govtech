import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { askAssistant } from '@/features/assistant/api/assistantApi'

// Mensagens anteriores que vão junto com a pergunta (a Edge Function aceita até 6)
const HISTORY = 5

// Conversa só na memória da tela: some ao fechar o painel (regra IA4)
export function useAssistant({ organizationId, context }) {
  const [messages, setMessages] = useState([])
  const [remaining, setRemaining] = useState(null)
  const mutation = useMutation({ mutationFn: askAssistant })

  function ask(question) {
    const content = question.trim()
    if (!content || mutation.isPending) return

    const conversation = [...messages, { role: 'user', content }]
    setMessages(conversation)

    mutation.mutate(
      { organizationId, context, messages: conversation.slice(-(HISTORY + 1)) },
      {
        onSuccess: ({ answer, remaining: left }) => {
          setMessages((current) => [...current, { role: 'assistant', content: answer }])
          setRemaining(left)
        },
      },
    )
  }

  return {
    messages,
    remaining,
    ask,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
