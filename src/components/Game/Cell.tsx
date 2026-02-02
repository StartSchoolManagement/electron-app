// src/components/Game/Cell.tsx

'use client'

import Electron from './Electron'
import LaneVertical from './svg/LaneVertical'
import LaneHorizontal from './svg/LaneHorizontal'
import LaneCornerRight from './svg/LaneCornerRight'
import LaneCornerUp from './svg/LaneCornerUp'
import LaneCornerLeft from './svg/LaneCornerLeft'
import LaneCornerDown from './svg/LaneCornerDown'
import LaneCross from './svg/LaneCross'
import DataFull from './svg/DataFull'
import DataEmpty from './svg/DataEmpty'

export default function Cell({
  type,
  hasPlayer,
  direction,
  carrying,
}: {
  type: string
  hasPlayer?: boolean
  direction?: 'up' | 'down' | 'left' | 'right'
  carrying?: boolean
}) {
  const base =
    'w-12 h-12 relative bg-emerald-950/40 border border-emerald-900 flex items-center justify-center'

  function renderTile() {
    switch (type) {
      case '1':
        return <LaneVertical />
      case '6':
        return <LaneHorizontal />
      case '+':
        return <LaneCross />
      case '2':
        return <LaneCornerRight />
      case '3':
        return <LaneCornerUp />
      case '4':
        return <LaneCornerLeft />
      case '5':
        return <LaneCornerDown />
      case '8':
        return <DataFull />
      case '9':
        return <DataEmpty />
      case '@':
        return <div className="opacity-50"><DataEmpty /></div>
      case '0':
        return (
          <div className="absolute inset-1 rounded-md" />
        )
      case '7':
        return <LaneVertical />
      default:
        // render uppercase letters as teleport markers (A..Z)
        if (typeof type === 'string' && type.length === 1 && type >= 'A' && type <= 'Z') {
          return (
            <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center text-xs font-bold text-white"></div>
          )
        }
        return null
    }
  }

  return (
    <div className={base}>
      {renderTile()}
      {hasPlayer && direction && (
        <Electron direction={direction} carrying={!!carrying} />
      )}
    </div>
  )
}
