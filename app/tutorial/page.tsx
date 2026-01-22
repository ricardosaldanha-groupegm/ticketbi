'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { Input } from '@/components/ui/input'

interface Section {
  id: string
  title: string
  level: number
  content: string
  subsections: Section[]
}

export default function TutorialPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSection, setActiveSection] = useState<string>('')
  const [tutorialContent, setTutorialContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState<'pt' | 'es'>('pt')
  const contentRef = useRef<HTMLDivElement>(null)

  // Load tutorial content
  useEffect(() => {
    setLoading(true)
    fetch(`/api/tutorial/content?lang=${language}`)
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          setTutorialContent(data.content)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading tutorial:', err)
        setLoading(false)
      })
  }, [language])

  // Parse markdown content into sections
  const sections = useMemo(() => {
    if (!tutorialContent) return []
    // Remove the leading "3" character if present
    const cleanContent = tutorialContent.startsWith('3') ? tutorialContent.substring(1) : tutorialContent
    const lines = cleanContent.split('\n')
    const parsed: Section[] = []
    const sectionStack: Section[] = []

    const createId = (title: string): string => {
      return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Check for headers
      const h1Match = line.match(/^# (.+)$/)
      const h2Match = line.match(/^## (.+)$/)
      const h3Match = line.match(/^### (.+)$/)
      const h4Match = line.match(/^#### (.+)$/)

      if (h1Match || h2Match || h3Match || h4Match) {
        const match = h1Match || h2Match || h3Match || h4Match
        const level = h1Match ? 1 : h2Match ? 2 : h3Match ? 3 : 4
        const title = match![1].replace(/^📋 /, '').trim()
        const id = createId(title)

        const newSection: Section = {
          id,
          title,
          level,
          content: '',
          subsections: []
        }

        // Pop stack until we find the right parent level
        while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].level >= level) {
          sectionStack.pop()
        }

        if (sectionStack.length === 0) {
          // Top level section
          parsed.push(newSection)
          sectionStack.push(newSection)
        } else {
          // Nested section
          const parent = sectionStack[sectionStack.length - 1]
          parent.subsections.push(newSection)
          sectionStack.push(newSection)
        }
      } else if (line.trim() && !line.match(/^---$/)) {
        // Add content to current section
        if (sectionStack.length > 0) {
          const current = sectionStack[sectionStack.length - 1]
          if (current.content) {
            current.content += '\n' + line
          } else {
            current.content = line
          }
        }
      }
    }

    return parsed
  }, [tutorialContent])

  // Filter sections based on search
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections

    const term = searchTerm.toLowerCase()
    return sections.filter(section => {
      const matchesTitle = section.title.toLowerCase().includes(term)
      const matchesContent = section.content.toLowerCase().includes(term)
      const matchesSubsections = section.subsections.some(sub => 
        sub.title.toLowerCase().includes(term) || 
        sub.content.toLowerCase().includes(term)
      )
      return matchesTitle || matchesContent || matchesSubsections
    })
  }, [sections, searchTerm])

  // Scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100
      const allSections = document.querySelectorAll('[data-section-id]')
      
      for (let i = allSections.length - 1; i >= 0; i--) {
        const section = allSections[i] as HTMLElement
        if (section.offsetTop <= scrollPosition) {
          setActiveSection(section.dataset.sectionId || '')
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [filteredSections])

  // Render markdown content to JSX
  const renderMarkdown = (content: string) => {
    if (!content) return null

    const lines = content.split('\n')
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    let currentOrderedList: string[] = []
    let inBlockquote = false
    let blockquoteContent: string[] = []

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside mb-4 space-y-1 text-slate-300">
            {currentList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: highlightText(item) }} />
            ))}
          </ul>
        )
        currentList = []
      }
      if (currentOrderedList.length > 0) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside mb-4 space-y-1 text-slate-300">
            {currentOrderedList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: highlightText(item) }} />
            ))}
          </ol>
        )
        currentOrderedList = []
      }
    }

    const flushBlockquote = () => {
      if (blockquoteContent.length > 0) {
        elements.push(
          <blockquote key={`blockquote-${elements.length}`} className="border-l-4 border-amber-500 pl-4 py-2 my-4 bg-slate-800/50 rounded-r">
            <div className="text-slate-300" dangerouslySetInnerHTML={{ __html: highlightText(blockquoteContent.join('\n')) }} />
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

      // Horizontal rule
      if (trimmed === '---') {
        flushList()
        elements.push(<hr key={`hr-${elements.length}`} className="my-6 border-slate-700" />)
        continue
      }

      // Lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        flushList()
        currentList.push(processInlineMarkdown(trimmed.substring(2)))
        continue
      }

      if (/^\d+\.\s/.test(trimmed)) {
        flushList()
        currentOrderedList.push(processInlineMarkdown(trimmed.replace(/^\d+\.\s/, '')))
        continue
      }

      // Empty line
      if (!trimmed) {
        flushList()
        if (elements.length > 0 && elements[elements.length - 1].type !== 'p') {
          elements.push(<br key={`br-${elements.length}`} />)
        }
        continue
      }

      // Regular paragraph
      flushList()
      const processed = processInlineMarkdown(trimmed)
      elements.push(
        <p key={`p-${elements.length}`} className="mb-4 text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightText(processed) }} />
      )
    }

    flushList()
    flushBlockquote()

    return elements
  }

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

  const highlightText = (text: string): string => {
    if (!searchTerm.trim()) return text
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-amber-500/30 text-amber-200 rounded px-1">$1</mark>')
  }

  const scrollToSection = (id: string) => {
    const element = document.querySelector(`[data-section-id="${id}"]`)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const allSections = useMemo(() => {
    const result: Array<{ id: string; title: string; level: number }> = []
    filteredSections.forEach(section => {
      result.push({ id: section.id, title: section.title, level: section.level })
      section.subsections.forEach(sub => {
        result.push({ id: sub.id, title: sub.title, level: sub.level })
        sub.subsections.forEach(subsub => {
          result.push({ id: subsub.id, title: subsub.title, level: subsub.level })
        })
      })
    })
    return result
  }, [filteredSections])

  if (loading) {
    return (
      <AuthenticatedLayout requireAuth={true}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-4"></div>
            <p className="text-slate-300">
              {language === 'pt' ? 'A carregar tutorial...' : 'Cargando tutorial...'}
            </p>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout requireAuth={true}>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              {language === 'pt' ? 'Tutorial para Utilizadores' : 'Tutorial para Usuarios'}
            </h1>
            <p className="text-slate-400">
              {language === 'pt' 
                ? 'Guia completo sobre como utilizar o TicketBI'
                : 'Guía completa sobre cómo utilizar TicketBI'}
            </p>
          </div>
          
          {/* Language Toggle */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setLanguage('pt')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                language === 'pt'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700'
              }`}
              title="Português"
            >
              <span className="text-lg">🇵🇹</span>
              <span>PT</span>
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                language === 'es'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700'
              }`}
              title="Español"
            >
              <span className="text-lg">🇪🇸</span>
              <span>ES</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 bg-slate-800 border border-slate-700 rounded-lg p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">
              {language === 'pt' ? 'Índice' : 'Índice'}
            </h2>
            <nav className="space-y-1">
              {allSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-amber-600 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                  } ${
                    section.level === 1 ? 'font-semibold' : 
                    section.level === 2 ? 'ml-2' : 
                    section.level === 3 ? 'ml-4 text-xs' : 'ml-6 text-xs'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search Bar */}
          <div className="mb-6">
            <Input
              type="text"
              placeholder={language === 'pt' ? 'Pesquisar no tutorial...' : 'Buscar en el tutorial...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          {/* Content */}
          <div ref={contentRef} className="bg-slate-800 border border-slate-700 rounded-lg p-8 prose prose-invert max-w-none">
            {filteredSections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">
                  {language === 'pt' 
                    ? `Nenhum resultado encontrado para "${searchTerm}"`
                    : `No se encontraron resultados para "${searchTerm}"`}
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-amber-400 hover:text-amber-300 underline"
                >
                  {language === 'pt' ? 'Limpar pesquisa' : 'Limpiar búsqueda'}
                </button>
              </div>
            ) : (
              filteredSections.map((section) => (
                <div key={section.id} data-section-id={section.id} className="scroll-mt-24">
                  <h2 className="text-2xl font-bold text-slate-100 mb-4 mt-8 first:mt-0 border-b border-slate-700 pb-2">
                    {highlightText(section.title)}
                  </h2>
                  
                  {renderMarkdown(section.content)}

                  {section.subsections.map((subsection) => (
                    <div key={subsection.id} data-section-id={subsection.id} className="scroll-mt-24">
                      <h3 className="text-xl font-semibold text-slate-100 mb-3 mt-6">
                        {highlightText(subsection.title)}
                      </h3>
                      
                      {renderMarkdown(subsection.content)}

                      {subsection.subsections.map((subsubsection) => (
                        <div key={subsubsection.id} data-section-id={subsubsection.id} className="scroll-mt-24">
                          <h4 className="text-lg font-medium text-slate-100 mb-2 mt-4">
                            {highlightText(subsubsection.title)}
                          </h4>
                          
                          {renderMarkdown(subsubsection.content)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
