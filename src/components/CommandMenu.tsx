'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search } from 'lucide-react'

export interface CommandMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  onSelect: () => void
}

/**
 * Command menu (Ctrl/Cmd+K), sem dependência nova — reusa o mesmo padrão de modal já usado no
 * detalhe de papel da Composição (Motion + clique-fora + Esc), nos tokens do projeto.
 */
export function CommandMenu({ items }: { items: CommandMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.label.toLowerCase().includes(q))
  }, [items, query])

  function close() {
    setOpen(false)
    setQuery('')
    setSelectedIndex(0)
  }

  // Atalho global — abre de qualquer lugar do app, sem precisar de um botão visível ocupando
  // espaço no header (é o ponto do padrão: escondido até ser chamado).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = filtered[selectedIndex]
        if (item) {
          close()
          item.onSelect()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filtered, selectedIndex])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[8vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Busca de comandos"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] overflow-hidden rounded-[7px] bg-paper-3 shadow-[var(--shadow-raised)]"
          >
            <div className="flex items-center gap-2.5 border-b border-rule-2 px-3.5 py-3">
              <Search className="size-4 shrink-0 text-ink-3" strokeWidth={2} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  // Reseta a seleção aqui, não num effect separado — evita o cascading render
                  // que o lint de setState-em-effect aponta pra estado derivado assim.
                  setSelectedIndex(0)
                }}
                placeholder="Buscar uma ação..."
                className="w-full border-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-3"
              />
              <kbd className="rounded border border-rule-2 px-1.5 py-0.5 text-[11px] text-ink-3">Esc</kbd>
            </div>
            <ul className="max-h-[300px] overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-[13px] text-ink-3">Nenhum resultado.</li>
              )}
              {filtered.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      close()
                      item.onSelect()
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-left text-[13.5px] transition-colors ${
                      index === selectedIndex ? 'bg-petrol/10 text-ink' : 'text-ink-2 hover:bg-paper'
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && <kbd className="text-[11px] text-ink-3">{item.shortcut}</kbd>}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
