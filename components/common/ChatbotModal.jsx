import { useState } from 'react'
import { X, Send, Bot, ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'O que é o GovTech?',
    answer: 'O GovTech é uma plataforma de governança de TI para gestão de projetos, auditoria e controle de acessos em ambientes de desenvolvimento de software.'
  },
  {
    question: 'Como criar um novo projeto?',
    answer: 'Vá até a página de Projetos, clique em "Novo Projeto", preencha as informações básicas (nome, repositório, branch, prazo) e adicione os membros da equipe.'
  },
  {
    question: 'O que são branches na governança?',
    answer: 'Branches representam linhas de desenvolvimento no Git. A branch "main" é a principal e mais estável, enquanto "dev" e "feature" são usadas para desenvolvimento de novas funcionalidades.'
  },
  {
    question: 'Como funciona a auditoria de eventos?',
    answer: 'A auditoria registra automaticamente todas as ações críticas: commits, pull requests, aprovações, acessos e mudanças de permissão. Esses registros são imutáveis e podem ser exportados.'
  },
  {
    question: 'O que é um semáforo de projeto?',
    answer: 'O semáforo indica a saúde do projeto: 🟢 Verde (no prazo, sem riscos), 🟡 Amarelo (atenção necessária), 🔴 Vermelho (risco crítico ou atrasado).'
  },
  {
    question: 'Como adicionar riscos a um projeto?',
    answer: 'Na página do projeto, vá até a seção "Riscos", clique em "Adicionar Risco", descreva o risco, classifique a probabilidade e impacto, e defina ações de mitigação.'
  },
  {
    question: 'O que é RBAC?',
    answer: 'RBAC (Role-Based Access Control) é o sistema de controle de acesso baseado em funções. Cada usuário recebe um papel (Admin, Developer, Viewer, etc.) com permissões específicas.'
  },
  {
    question: 'Como exportar dados de auditoria?',
    answer: 'Na página de Auditoria, clique em "Exportar Dados" no topo da página. Um arquivo CSV com todos os eventos será baixado automaticamente.'
  }
]

export default function ChatbotModal({ onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Olá! Sou o assistente virtual do GovTech. Como posso ajudar você hoje?'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [expandedFaq, setExpandedFaq] = useState(null)

  const handleSend = () => {
    if (!inputValue.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    setTimeout(() => {
      const botResponse = getBotResponse(inputValue)
      setMessages(prev => [...prev, botResponse])
    }, 500)
  }

  const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase()
    
    if (input.includes('projeto') && (input.includes('criar') || input.includes('novo'))) {
      return {
        id: messages.length + 2,
        type: 'bot',
        text: 'Para criar um projeto: 1) Vá em Projetos, 2) Clique em "Novo Projeto", 3) Preencha nome, repositório e prazo, 4) Adicione a equipe.'
      }
    }
    
    if (input.includes('auditoria') || input.includes('audit') || input.includes('evento')) {
      return {
        id: messages.length + 2,
        type: 'bot',
        text: 'A auditoria registra todas as ações do sistema. Você pode filtrar por status e exportar os dados em CSV.'
      }
    }
    
    if (input.includes('acesso') || input.includes('permissão') || input.includes('rbac') || input.includes('papel')) {
      return {
        id: messages.length + 2,
        type: 'bot',
        text: 'O controle de acesso (RBAC) permite gerenciar papéis como Admin, Developer, Viewer e Stakeholder, cada um com permissões específicas.'
      }
    }
    
    if (input.includes('risco') || input.includes('semáforo') || input.includes('saúde')) {
      return {
        id: messages.length + 2,
        type: 'bot',
        text: 'Os riscos são classificados por probabilidade e impacto. O semáforo mostra a saúde: verde (ok), amarelo (atenção), vermelho (crítico).'
      }
    }
    
    if (input.includes('exportar') || input.includes('csv') || input.includes('dados')) {
      return {
        id: messages.length + 2,
        type: 'bot',
        text: 'Clique em "Exportar Dados" na página de Auditoria para baixar um CSV com todos os eventos registrados.'
      }
    }
    
    if (input.includes('branch') || input.includes('git') || input.includes('repositório')) {
      return {
        id: messages.length + 2,
        type: 'bot',
        text: 'Branches são linhas de desenvolvimento no Git. Use "main" para produção, "dev" para desenvolvimento e "feature" para novas funcionalidades.'
      }
    }
    
    return {
      id: messages.length + 2,
      type: 'bot',
      text: 'Entendi! Você pode consultar as perguntas frequentes abaixo ou me fazer uma pergunta específica sobre projetos, auditoria, acessos ou riscos.'
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: '24px',
        zIndex: 1000
      }}
    >
      <div 
        className="chatbot-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '400px',
          maxWidth: '90vw',
          height: '600px',
          maxHeight: '80vh',
          backgroundColor: 'var(--surface, white)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--color-primary-600, #0066CC)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={24} />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                Assistente GovTech
              </h3>
              <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>
                Guia de governança
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: 'var(--bg-secondary, #f8f9fa)'
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {message.type === 'bot' && (
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-600, #0066CC)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                >
                  <Bot size={18} color="white" />
                </div>
              )}
              
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: message.type === 'user' ? 'var(--color-primary-600, #0066CC)' : 'var(--surface, white)',
                  color: message.type === 'user' ? 'white' : 'var(--text-primary, #1a1a1a)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  boxShadow: message.type === 'user' ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div 
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--surface, white)',
            borderTop: '1px solid var(--border, #e5e7eb)',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--muted, #6b7280)' }}>
            PERGUNTAS FREQUENTES
          </h4>
          
          {faqs.map((faq, index) => (
            <div 
              key={index}
              style={{ marginBottom: '8px' }}
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-secondary, #f8f9fa)',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text-secondary, #374151)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary, #f3f4f6)'
                  e.currentTarget.style.borderColor = 'var(--border-hover, #d1d5db)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f8f9fa)'
                  e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)'
                }}
              >
                <span style={{ flex: 1 }}>{faq.question}</span>
                <ChevronDown 
                  size={16} 
                  style={{ 
                    transform: expandedFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }} 
                />
              </button>
              
              {expandedFaq === index && (
                <div 
                  style={{
                    padding: '12px',
                    marginTop: '4px',
                    backgroundColor: 'var(--bg-secondary, #f8f9fa)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: 'var(--text-secondary, #4b5563)'
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div 
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--surface, white)',
            borderTop: '1px solid var(--border, #e5e7eb)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end'
          }}
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua dúvida..."
            rows={1}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid var(--border, #d1d5db)',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'none',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s',
              backgroundColor: 'var(--surface, white)',
              color: 'var(--text-primary, #1a1a1a)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary-600, #0066CC)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border, #d1d5db)'}
          />
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            style={{
              padding: '12px 16px',
              backgroundColor: inputValue.trim() ? 'var(--color-primary-600, #0066CC)' : 'var(--muted, #9ca3af)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}