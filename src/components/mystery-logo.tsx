'use client'

import { motion } from 'framer-motion'

export function MysteryLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: { emoji: 'text-2xl', title: 'text-base', subtitle: 'text-[10px]' },
    md: { emoji: 'text-4xl', title: 'text-2xl', subtitle: 'text-xs' },
    lg: { emoji: 'text-6xl', title: 'text-4xl', subtitle: 'text-sm' },
    xl: { emoji: 'text-8xl', title: 'text-6xl', subtitle: 'text-base' },
  } as const
  const s = sizes[size]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col items-center text-center select-none"
    >
      <motion.div
        animate={{ rotate: [0, -8, 8, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className={s.emoji}
      >
        🕵️
      </motion.div>
      <div className={`font-extrabold tracking-tight leading-none mt-2 ${s.title}`}>
        <span className="text-primary">AMIGOS</span>
      </div>
      <div className={`font-extrabold tracking-tight leading-none ${s.title}`}>
        <span className="text-accent">ULTRASECRETOS</span>
      </div>
      <div className={`text-muted-foreground mt-1 uppercase tracking-[0.2em] font-medium ${s.subtitle}`}>
        Solo secretos
      </div>
    </motion.div>
  )
}
