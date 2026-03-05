'use client'

import { useState, useMemo } from 'react'
import Link from "next/link"
import Image from 'next/image'

const contentPT = {
  title: 'Ajuda ao Utilizador',
  subtitle: 'Informações essenciais sobre o TicketBI',
  introduction: {
    title: 'Introdução',
    content: `O **TicketBI** é uma plataforma que permite aos utilizadores solicitar serviços e suporte ao Departamento de Sistemas e Inteligência (DSI). Através deste sistema, pode criar tickets para pedidos de BI, PHC, Salesforce, Automação, Suporte, Dados/Análises e outros serviços internos.

Este tutorial irá guiá-lo através das funcionalidades principais do sistema, desde a criação de um ticket até ao acompanhamento do seu progresso.`
  },
  access: {
    title: 'Acesso ao Sistema',
    firstAccess: {
      title: 'Primeiro Acesso - Pedir Acesso',
      content: `Se ainda não tem uma conta no sistema, precisa de solicitar acesso primeiro:

1. Aceda ao endereço do TicketBI: [https://ticketbi.vercel.app/](https://ticketbi.vercel.app/)
2. Na página de login, clique no tab **"Pedir Acesso"**
3. Preencha o formulário de pedido de acesso:
   - **Nome:** O seu nome completo
   - **Email:** O seu email profissional (apenas emails profissionais são aceites)
   - **Mensagem:** (Opcional) Pode adicionar uma mensagem explicando o motivo do pedido
4. Clique em **"Enviar Pedido"** ou **"Submeter"**

> **Importante:** 
> - Apenas emails profissionais são aceites (ex: @groupegm.com)
> - O seu pedido será analisado por um administrador
> - Receberá uma notificação por email quando o seu pedido for aprovado ou rejeitado
> - Após aprovação, poderá fazer login no sistema`
    },
    emails: {
      title: 'Emails de Autenticação',
      content: `Quando o seu pedido de acesso for aprovado, receberá um email de autenticação do sistema:

- **Remetente:** \`Bot GGMPI <botpi@groupegm.com>\`
- **Assunto:** \`O Pedido de acesso ao TicketBI foi aprovado\`

> **⚠️ Atenção - Verificar Pasta de Spam:**
> 
> - Os emails de autenticação podem ser classificados como **spam** pelo seu cliente de email
> - **Verifique sempre a pasta de Spam/Lixo Eletrónico** se não receber o email na sua caixa de entrada
> - **Recomendação:** Marque o email como **"Não é Spam"** ou adicione o remetente \`botpi@groupegm.com\` à sua lista de contactos seguros
> - Isto garante que receberá todos os emails futuros do sistema na sua caixa de entrada`
    },
    login: {
      title: 'Como Fazer Login',
      content: `Após ter o seu pedido de acesso aprovado:

1. Aceda ao endereço do TicketBI: [https://ticketbi.vercel.app/](https://ticketbi.vercel.app/)
2. Clique no tab **"Login"** ou **"Entrar"**
3. Introduza o seu **email profissional** e **palavra-passe**
4. Clique em **"Iniciar Sessão"**

> **Nota:** Se não recebeu o email de criação de conta, verifique a pasta de Spam e procure por emails com o assunto **"O Pedido de acesso ao TicketBI foi aprovado"** ou do remetente \`botpi@groupegm.com\``
    },
    forgotPassword: {
      title: 'Esqueci-me da palavra-passe',
      content: `Se esqueceu a sua palavra-passe, pode solicitar um link de recuperação:

1. Na página de login, clique em **"Esqueci-me da password"** (por baixo do campo da palavra-passe)
2. Será redirecionado para a página **"Recuperar Password"**
3. Introduza o seu **email profissional**
4. Clique em **"Enviar link de recuperação"**
5. Verifique o seu email (incluindo a pasta de **Spam**) — receberá um link para redefinir a palavra-passe
6. Clique no link e defina uma nova palavra-passe
7. Após definir a nova palavra-passe, poderá fazer login normalmente

> **Importante:** O link de recuperação tem validade limitada. Se expirar, peça um novo link. O sistema não revela se o email existe ou não — por segurança, a mensagem é sempre a mesma.`
    },
    changePassword: {
      title: 'Alterar palavra-passe',
      content: `- **Primeiro acesso:** Em alguns casos, o sistema redireciona-o para uma página onde deve definir uma nova palavra-passe antes de continuar.
- **Já autenticado:** Se precisar de alterar a palavra-passe estando já autenticado, o sistema pode solicitar essa alteração quando aplicável. Em alternativa, contacte o administrador.`
    },
    firstTime: {
      title: 'Primeira Vez no Sistema',
      content: `Após o primeiro login, será redirecionado para a página principal onde pode:
- Ver os seus tickets existentes
- Criar um novo ticket
- Aceder ao menu de navegação`
    }
  }
}

const contentES = {
  title: 'Ayuda al Usuario',
  subtitle: 'Información esencial sobre TicketBI',
  introduction: {
    title: 'Introducción',
    content: `**TicketBI** es una plataforma que permite a los usuarios solicitar servicios y soporte al Departamento de Sistemas e Inteligencia (DSI). A través de este sistema, puede crear tickets para solicitudes de BI, PHC, Salesforce, Automatización, Soporte, Datos/Análisis y otros servicios internos.

Este tutorial le guiará a través de las funcionalidades principales del sistema, desde la creación de un ticket hasta el seguimiento de su progreso.`
  },
  access: {
    title: 'Acceso al Sistema',
    firstAccess: {
      title: 'Primer Acceso - Pedir Acesso',
      content: `Si aún no tiene una cuenta en el sistema, necesita solicitar acceso primero:

1. Acceda a la dirección de TicketBI: [https://ticketbi.vercel.app/](https://ticketbi.vercel.app/)
2. En la página de inicio de sesión, haga clic en la pestaña **"Pedir Acesso"**
3. Complete el formulario de solicitud de acceso:
   - **Nome:** Su nombre completo
   - **Email:** Su email profesional (solo se aceptan emails profesionales)
   - **Mensagem:** (Opcional) Puede agregar un mensaje explicando el motivo de la solicitud
4. Haga clic en **"Enviar Pedido"** o **"Submeter"**

> **Importante:** 
> - Solo se aceptan emails profesionales (ej: @groupegm.com)
> - Su solicitud será analizada por un administrador
> - Recibirá una notificación por email cuando su solicitud sea aprobada o rechazada
> - Después de la aprobación, podrá iniciar sesión en el sistema`
    },
    emails: {
      title: 'Emails de Autenticación',
      content: `Cuando su solicitud de acceso sea aprobada, recibirá un email de autenticación del sistema:

- **Remetente:** \`Bot GGMPI <botpi@groupegm.com>\`
- **Assunto:** \`O Pedido de acesso ao TicketBI foi aprovado\`

> **⚠️ Atención - Verificar Carpeta de Spam:**
> 
> - Los emails de autenticación pueden ser clasificados como **spam** por su cliente de email
> - **Verifique siempre la carpeta de Spam/Correo no deseado** si no recibe el email en su bandeja de entrada
> - **Recomendación:** Marque el email como **"No es Spam"** o agregue el remitente \`botpi@groupegm.com\` a su lista de contactos seguros
> - Esto garantiza que recibirá todos los emails futuros del sistema en su bandeja de entrada`
    },
    login: {
      title: 'Cómo Iniciar Sesión',
      content: `Después de que su solicitud de acceso sea aprobada:

1. Acceda a la dirección de TicketBI: [https://ticketbi.vercel.app/](https://ticketbi.vercel.app/)
2. Haga clic en la pestaña **"Login"** o **"Entrar"**
3. Introduzca su **email profissional** y **palavra-passe**
4. Haga clic en **"Iniciar Sessão"**

> **Nota:** Si no recibió el email de creación de cuenta, verifique la carpeta de Spam y busque emails con el asunto **"O Pedido de acesso ao TicketBI foi aprovado"** o del remitente \`botpi@groupegm.com\``
    },
    forgotPassword: {
      title: 'He olvidado mi contraseña',
      content: `Si ha olvidado su contraseña, puede solicitar un enlace de recuperación:

1. En la página de inicio de sesión, haga clic en **"Esqueci-me da password"** (debajo del campo de contraseña)
2. Será redirigido a la página **"Recuperar Password"**
3. Introduzca su **email profesional**
4. Haga clic en **"Enviar link de recuperación"**
5. Verifique su email (incluyendo la carpeta de **Spam**) — recibirá un enlace para restablecer la contraseña
6. Haga clic en el enlace y defina una nueva contraseña
7. Después de definir la nueva contraseña, podrá iniciar sesión normalmente

> **Importante:** El enlace de recuperación tiene validez limitada. Si expira, solicite un nuevo enlace. El sistema no revela si el email existe o no — por seguridad, el mensaje es siempre el mismo.`
    },
    changePassword: {
      title: 'Cambiar contraseña',
      content: `- **Primer acceso:** En algunos casos, el sistema le redirige a una página donde debe definir una nueva contraseña antes de continuar.
- **Ya autenticado:** Si necesita cambiar la contraseña estando ya autenticado, el sistema puede solicitar esa alteración cuando aplique. Alternativamente, contacte al administrador.`
    },
    firstTime: {
      title: 'Primera Vez en el Sistema',
      content: `Después del primer inicio de sesión, será redirigido a la página principal donde puede:
- Ver sus tickets existentes
- Crear un nuevo ticket
- Acceder al menú de navegación`
    }
  }
}

export default function AjudaPage() {
  const [language, setLanguage] = useState<'pt' | 'es'>('pt')
  const content = language === 'pt' ? contentPT : contentES

  const processInlineMarkdown = (text: string): string => {
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-100">$1</strong>')
    // Italic
    text = text.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-400 hover:text-amber-300 underline">$1</a>')
    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono text-sm">$1</code>')
    return text
  }

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    let inBlockquote = false
    let blockquoteContent: string[] = []

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside mb-4 space-y-1 text-slate-300 ml-4">
            {currentList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: processInlineMarkdown(item) }} />
            ))}
          </ul>
        )
        currentList = []
      }
    }

    const flushBlockquote = () => {
      if (blockquoteContent.length > 0) {
        elements.push(
          <blockquote key={`blockquote-${elements.length}`} className="border-l-4 border-amber-500 pl-4 py-2 my-4 bg-slate-800/50 rounded-r">
            <div className="text-slate-300 text-sm" dangerouslySetInnerHTML={{ __html: processInlineMarkdown(blockquoteContent.join('\n')) }} />
          </blockquote>
        )
        blockquoteContent = []
        inBlockquote = false
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // Blockquote
      if (trimmed.startsWith('> ')) {
        if (!inBlockquote) {
          flushList()
          flushBlockquote()
          inBlockquote = true
        }
        blockquoteContent.push(trimmed.substring(2))
        continue
      } else if (inBlockquote) {
        flushBlockquote()
      }

      // Lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        flushList()
        currentList.push(trimmed.substring(2))
        continue
      }

      if (/^\d+\.\s/.test(trimmed)) {
        flushList()
        const listItem = trimmed.replace(/^\d+\.\s/, '')
        currentList.push(listItem)
        continue
      }

      // Empty line
      if (!trimmed) {
        flushList()
        continue
      }

      // Regular paragraph
      flushList()
      const processed = processInlineMarkdown(trimmed)
      elements.push(
        <p key={`p-${elements.length}`} className="mb-4 text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />
      )
    }

    flushList()
    flushBlockquote()

    return elements
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-lg p-6 md:p-8 text-slate-100">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/ticketbi-icon.png" alt="TicketBI" width={48} height={48} className="h-12 w-12 flex-shrink-0" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{content.title}</h1>
            <p className="text-slate-400">
                {content.subtitle}
              </p>
            </div>
          </div>
          
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setLanguage('pt')}
              className={`p-2 rounded-md transition-all flex items-center justify-center ${
                language === 'pt'
                  ? 'bg-amber-600 shadow-md scale-110'
                  : 'hover:bg-slate-700 opacity-70 hover:opacity-100'
              }`}
              title="Português"
            >
              <span className="text-2xl">🇵🇹</span>
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`p-2 rounded-md transition-all flex items-center justify-center ${
                language === 'es'
                  ? 'bg-amber-600 shadow-md scale-110'
                  : 'hover:bg-slate-700 opacity-70 hover:opacity-100'
              }`}
              title="Español"
            >
              <span className="text-2xl">🇪🇸</span>
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Introdução */}
          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 border-b border-slate-700 pb-2">
              {content.introduction.title}
            </h2>
            <div className="text-slate-300">
              {renderMarkdown(content.introduction.content)}
            </div>
          </section>

          {/* Acesso ao Sistema */}
          <section>
            <h2 className="text-xl font-semibold text-slate-100 mb-4 border-b border-slate-700 pb-2">
              {content.access.title}
            </h2>

            {/* Primeiro Acesso */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-100 mb-3">
                {content.access.firstAccess.title}
              </h3>
              <div className="text-slate-300">
                {renderMarkdown(content.access.firstAccess.content)}
              </div>
            </div>

            {/* Emails de Autenticação */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-100 mb-3">
                {content.access.emails.title}
              </h3>
              <div className="text-slate-300">
                {renderMarkdown(content.access.emails.content)}
              </div>
            </div>

            {/* Como Fazer Login */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-100 mb-3">
                {content.access.login.title}
              </h3>
              <div className="text-slate-300">
                {renderMarkdown(content.access.login.content)}
              </div>
            </div>

            {/* Esqueci-me da palavra-passe */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-100 mb-3">
                {content.access.forgotPassword.title}
              </h3>
              <div className="text-slate-300">
                {renderMarkdown(content.access.forgotPassword.content)}
              </div>
            </div>

            {/* Alterar palavra-passe */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-100 mb-3">
                {content.access.changePassword.title}
              </h3>
              <div className="text-slate-300">
                {renderMarkdown(content.access.changePassword.content)}
              </div>
            </div>

            {/* Primeira Vez no Sistema */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-100 mb-3">
                {content.access.firstTime.title}
              </h3>
              <div className="text-slate-300">
                {renderMarkdown(content.access.firstTime.content)}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <Link
            href="/login"
            className="px-4 py-2 rounded-md border border-slate-600 text-slate-100 hover:bg-slate-800 text-sm transition-colors"
          >
            {language === 'pt' ? 'Voltar ao Login' : 'Volver al Login'}
          </Link>
        </div>
      </div>
    </div>
  )
}
