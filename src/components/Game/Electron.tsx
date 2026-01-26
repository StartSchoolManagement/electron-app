// src/components/Game/Electron.tsx

'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Direction } from '@/game/types'

export default function Electron({
  direction,
  carrying,
}: {
  direction: Direction
  carrying: boolean
}) {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!glowRef.current) return

    gsap.to(glowRef.current, {
      scale: 1.4,
      opacity: 0.9,
      duration: 0.6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  }, [])

  const rotate =
    direction === 'up'
      ? 'rotate-45'
      : direction === 'right'
      ? 'rotate-[135deg]'
      : direction === 'down'
      ? 'rotate-[225deg]'
      : 'rotate-[-45deg]'

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        ref={glowRef}
        className={`absolute w-6 h-6 blur-lg ${
          carrying ? 'bg-cyan-500' : 'bg-yellow-500'
        } opacity-70`}
      />
      <div
        className={`w-3 h-3 ${rotate} bg-white shadow-[0_0_12px_rgba(34,211,238,0.9)]`}
      />
    </div>
  )
}
