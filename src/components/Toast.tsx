'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'

const TOAST_DURATION_MS = 3200

interface ToastItem {
  id: string
  message: string
}

/** Fila de confirmações transitórias (ex: "Premissa salva"), independente de qualquer banner de erro inline. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const showToast = useCallback((message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message }])
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
      timers.current.delete(id)
    }, TOAST_DURATION_MS)
    timers.current.set(id, timer)
  }, [])

  return { toasts, showToast }
}

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-2 rounded-[7px] bg-paper-3 px-3.5 py-2.5 text-[13px] font-medium text-ink shadow-[var(--shadow-raised)]"
          >
            <Check className="size-3.5 shrink-0 text-moss" strokeWidth={2.5} />
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
