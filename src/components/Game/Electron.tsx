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
      ? 0
      : direction === 'right'
      ? 90
      : direction === 'down'
      ? 180
      : -90

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        ref={glowRef}
        className={`absolute w-6 h-6 blur-lg ${
          carrying ? 'bg-cyan-500' : 'bg-yellow-500'
        } opacity-70`}
      />
      <svg
        width="14"
        height="18"
        viewBox="0 0 14 18"
        style={{ transform: `rotate(${rotate}deg)` }}
        className="drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]"
      >
        <polygon
          points="7,0 14,10 7,18 0,10"
          fill="white"
        />
      </svg>
    </div>
  )
}
