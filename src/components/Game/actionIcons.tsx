// src/components/Game/actionIcons.tsx

import { ProgramNode } from '@/game/types'

import ArrowUp from '@/components/Game/svg/Forward'
import ArrowLeft from '@/components/Game/svg/ArrowLeft'
import ArrowRight from '@/components/Game/svg/ArrowRight'
import PickUp from '@/components/Game/svg/PickUp'
import PutDown from '@/components/Game/svg/PutDown'
import ArrowLoop from '@/components/Game/svg/ArrowLoop'
import WordIF from '@/components/Game/svg/WordIF'

export function getNodeIcon(node: ProgramNode): React.ReactNode {
  if (node.type === 'action') {
    switch (node.action) {
      case 'forward':
        return <ArrowUp />
      case 'left':
        return <ArrowLeft />
      case 'right':
        return <ArrowRight />
      case 'pickup':
        return <PickUp />
      case 'putdown':
        return <PutDown />
    }
  }

  if (node.type === 'loop') return <ArrowLoop />

  if (node.type === 'if') {
    return <WordIF />
  }

  return null
}
