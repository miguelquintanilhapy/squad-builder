'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import { useIsMobile } from '@/lib/useViewport'
import { TOUCH_TARGET_EXPAND } from '@/components/ui/primitives'

export interface CommandMenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  onSelect: () => void
}

/** Lista de resultados compartilhada pelas duas apresentações (mobile e desktop) — a navegação
 * por teclado/hover é idêntica nas duas, só a densidade visual (padding) muda. */
function CommandResultsList({
  items,
  selectedIndex,
  onHover,
  onSelect,
  dense,
}: {
  items: CommandMenuItem[]
  selectedIndex: number
  onHover: (index: number) => void
  onSelect: (item: CommandMenuItem) => void
  dense: boolean
}) {
  return (
    <ul className="max-h-[300px] overflow-y-auto p-1.5">
      {items.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-ink-3">Nenhum resultado.</li>}
      {items.map((item, index) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            onMouseEnter={() => onHover(index)}
            className={`flex w-full items-center gap-2.5 rounded-[7px] px-3 text-left text-[13.5px] transition-colors ${
              dense ? 'py-2' : 'py-3'
            } ${index === selectedIndex ? 'bg-petrol/10 text-ink' : 'text-ink-2 hover:bg-paper'}`}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && <kbd className="text-[11px] text-ink-3">{item.shortcut}</kbd>}
          </button>
        </li>
      ))}
    </ul>
  )
}

interface ListProps {
  filtered: CommandMenuItem[]
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  close: () => void
  onSelectItem: (item: CommandMenuItem) => void
}

/** Bottom sheet — sem campo de busca: pra um menu de 2-4 destinos, um input autofocado abrindo o
 * teclado lia como bug ("abri o menu e ganhei uma busca?"). Cabeçalho com rótulo + botão de
 * fechar em vez do hint "Esc", que não existe no touch. Mesmo padrão visual do RoleDetailModal
 * (CompositionTable) — desliza de baixo, ocupa a largura toda, respeita a safe area. */
function MobileCommandSheet({ filtered, selectedIndex, setSelectedIndex, close, onSelectItem }: ListProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={close}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Navegar"
        initial={{ opacity: 1, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 1, y: '100%' }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] as const }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[14px] bg-paper-3 shadow-[var(--shadow-raised)]"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between gap-2.5 border-b border-rule-2 px-4 py-3">
          <span className="text-[13px] font-medium text-ink-2">Navegar</span>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className={`shrink-0 rounded-full p-1 text-ink-3 hover:bg-paper hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2 ${TOUCH_TARGET_EXPAND}`}
          >
            <X className="size-4" />
          </button>
        </div>
        <CommandResultsList items={filtered} selectedIndex={selectedIndex} onHover={setSelectedIndex} onSelect={onSelectItem} dense={false} />
      </motion.div>
    </motion.div>
  )
}

/** Paleta de busca top-anchored — comportamento original, inalterado, a partir de sm. */
function DesktopCommandPalette({
  filtered,
  selectedIndex,
  setSelectedIndex,
  close,
  onSelectItem,
  query,
  setQuery,
  inputRef,
}: ListProps & {
  query: string
  setQuery: (query: string) => void
  inputRef: RefObject<HTMLInputElement | null>
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[4vh] sm:pt-[8vh]"
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
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] as const }}
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
              // Reseta a seleção aqui, não num effect separado — evita o cascading render que o
              // lint de setState-em-effect aponta pra estado derivado assim.
              setSelectedIndex(0)
            }}
            placeholder="Buscar uma ação..."
            className="w-full border-0 bg-transparent text-base text-ink outline-none placeholder:text-ink-3 sm:text-sm"
          />
          <kbd className="rounded border border-rule-2 px-1.5 py-0.5 text-[11px] text-ink-3">Esc</kbd>
        </div>
        <CommandResultsList items={filtered} selectedIndex={selectedIndex} onHover={setSelectedIndex} onSelect={onSelectItem} dense />
      </motion.div>
    </motion.div>
  )
}

/**
 * Command menu (Ctrl/Cmd+K), sem dependência nova — reusa o mesmo padrão de modal já usado no
 * detalhe de papel da Composição (Motion + clique-fora + Esc), nos tokens do projeto.
 * Controlado por fora (open/onOpenChange) — no mobile não tem atalho de teclado, então o header
 * precisa de um botão visível que abra o mesmo menu.
 *
 * Este componente só possui estado/efeitos (busca, seleção por teclado, foco) — a apresentação
 * visual mobile vs. desktop, que difere estruturalmente (bottom sheet sem busca vs. paleta com
 * busca), fica inteira em MobileCommandSheet/DesktopCommandPalette, cada um só com sua própria
 * árvore JSX, em vez de um único retorno com `isMobile ?` espalhado por vários pontos.
 */
export function CommandMenu({
  items,
  open,
  onOpenChange,
}: {
  items: CommandMenuItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  // No mobile isso vira uma lista de toque simples (sem busca) — não existe teclado físico pra
  // justificar autofocar um input de busca, e um menu de 2-4 destinos não precisa de filtro.
  const isMobile = useIsMobile()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.label.toLowerCase().includes(q))
  }, [items, query])

  const close = useCallback(() => {
    onOpenChange(false)
    setQuery('')
    setSelectedIndex(0)
  }, [onOpenChange])

  function handleSelectItem(item: CommandMenuItem) {
    close()
    item.onSelect()
  }

  // Atalho global de teclado — abre de qualquer lugar do app, sem precisar de um botão visível
  // ocupando espaço no header. No touch (sem teclado físico) quem abre é o botão do header.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open && !isMobile) inputRef.current?.focus()
  }, [open, isMobile])

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
        if (item) handleSelectItem(item)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filtered, selectedIndex, close])

  return (
    <AnimatePresence>
      {open &&
        (isMobile ? (
          <MobileCommandSheet
            filtered={filtered}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            close={close}
            onSelectItem={handleSelectItem}
          />
        ) : (
          <DesktopCommandPalette
            filtered={filtered}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            close={close}
            onSelectItem={handleSelectItem}
            query={query}
            setQuery={setQuery}
            inputRef={inputRef}
          />
        ))}
    </AnimatePresence>
  )
}
