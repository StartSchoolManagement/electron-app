'use client'

import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { levels } from '@/game/levels'
import { ProgramNode, Condition } from '@/game/types'
import { getNodeIcon } from './actionIcons'
import PickerButton from './PickerButton'

import ArrowUp from '@/components/Game/svg/Forward'
import ArrowLeft from '@/components/Game/svg/ArrowLeft'
import ArrowRight from '@/components/Game/svg/ArrowRight'
import PickUp from '@/components/Game/svg/PickUp'
import PutDown from '@/components/Game/svg/PutDown'
import ArrowLoop from '@/components/Game/svg/ArrowLoop'
import WordIF from '@/components/Game/svg/WordIF'
import DataEmpty from '@/components/Game/svg/DataEmpty'
import DataFull from '@/components/Game/svg/DataFull'
import LaneCornerUp from '@/components/Game/svg/LaneCornerUp'
import LaneCornerDown from '@/components/Game/svg/LaneCornerDown'
import LaneCornerLeft from '@/components/Game/svg/LaneCornerLeft'
import LaneCornerRight from '@/components/Game/svg/LaneCornerRight'

type PickerMode = 'action' | 'if-condition' | 'if-then' | null

const ACTIONS: {
  node: ProgramNode
  icon: React.ReactNode
}[] = [
  { node: { type: 'action', action: 'forward' }, icon: <ArrowUp /> },
  { node: { type: 'action', action: 'left' }, icon: <ArrowLeft /> },
  { node: { type: 'action', action: 'right' }, icon: <ArrowRight /> },
  { node: { type: 'action', action: 'pickup' }, icon: <PickUp /> },
  { node: { type: 'action', action: 'putdown' }, icon: <PutDown /> },
  { node: { type: 'loop' }, icon: <ArrowLoop /> },
  {
    node: {
      type: 'if',
      condition: 'onData',
      then: { type: 'action', action: 'pickup' },
    },
    icon: <WordIF />,
  },
]

export default function ActionBar() {
  const { program, addNode, setNodeAt, insertNodeAt, levelIndex, executingIndex } = useGameStore()
  const level = levels[levelIndex]

  const [picker, setPicker] = useState<PickerMode>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [tempIfConditions, setTempIfConditions] = useState<Condition[]>([])

  function toggleTempCondition(c: Condition) {
    // corners only — select single corner and proceed to THEN
    setTempIfConditions([c])
    setPicker('if-then')
  }

  const pickerRef = useRef<HTMLDivElement | null>(null)

  function openPicker(index: number, node?: ProgramNode) {
    setEditIndex(index)
    if (node?.type === 'if') {
      // if already editing this IF, a repeated click should allow replacing it with a basic action
      if (picker === 'if-then' && editIndex === index) {
        setPicker('action')
        return
      }
      setTempIfConditions(Array.isArray(node.condition) ? node.condition : [node.condition])
      // open the IF -> THEN picker so user can change the then-action
      setPicker('if-then')
    } else {
      setPicker('action')
    }
  }

  function closeAll() {
    setPicker(null)
    setEditIndex(null)
    setTempIfConditions([])
  }

  function commitNode(node: ProgramNode) {
    if (editIndex !== null) {
      if (program[editIndex]) {
        setNodeAt(editIndex, node)
      } else {
        insertNodeAt(editIndex, node)
      }
    } else {
      addNode(node)
    }
    closeAll()
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        closeAll()
      }
    }
    if (picker) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [picker])

  const visibleActions = ACTIONS.slice(0, level.allowedActionsCount)

  return (
    <div className="relative rounded-xl border border-cyan-400/20 bg-slate-900 p-4">
      <div className="mb-3 text-center text-xs uppercase tracking-widest text-cyan-300">
        Program ({program.length}/{level.maxActions})
      </div>

      {/* PROGRAM SLOTS */}
      <div className="flex justify-center">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${level.maxActions}, minmax(40px, 48px))`,
          }}
        >
          {Array.from({ length: level.maxActions }).map((_, i) => {
            const node = program[i]
            const isActive = executingIndex === i
            return (
              <button
                key={i}
                onClick={() => openPicker(i, node)}
                className={[
                  'aspect-square rounded-md border flex items-center justify-center p-2',
                  isActive ? 'border-yellow-400/80 bg-yellow-400/5 ring-2 ring-yellow-400/30 animate-pulse' : node
                    ? 'border-cyan-400/60 text-cyan-200'
                    : 'border-slate-700 hover:border-cyan-400/40',
                ].join(' ')}
              >
                {node ? getNodeIcon(node) : null}
              </button>
            )
          })}
        </div>
      </div>

      {/* PICKERS */}
      {picker && (
        <div
          ref={pickerRef}
          className="
            fixed inset-x-0 bottom-0 z-50
            rounded-t-2xl border-t border-cyan-400/30
            bg-slate-950 p-4 shadow-2xl
            md:absolute md:left-1/2 md:top-[-2.5rem] md:bottom-auto
            md:-translate-x-1/2 md:rounded-xl md:border
            max-h-[45vh] overflow-auto md:max-w-[560px]
          "
        >
          {/* MAIN ACTION PICKER */}
          {picker === 'action' && (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(48px, 1fr))',
              }}
            >
              {visibleActions.map((item, i) =>
                item.node.type === 'if' ? (
                  <PickerButton
                    key={i}
                    icon={item.icon}
                    onClick={() => setPicker('if-condition')}
                  />
                ) : (
                  <PickerButton
                    key={i}
                    icon={item.icon}
                    onClick={() => commitNode(item.node)}
                  />
                )
              )}
            </div>
          )}

          {/* IF – CONDITION */}
          {picker === 'if-condition' && (
            <div className="flex justify-center gap-3 flex-wrap">
              <PickerButton
                icon={<DataFull />}
                onClick={() => toggleTempCondition('onData')}
              />
              <PickerButton
                icon={<DataEmpty />}
                onClick={() => toggleTempCondition('onEmpty')}
              />
              <PickerButton
                icon={<LaneCornerUp />}
                onClick={() => toggleTempCondition('onCornerUp')}
              />
              <PickerButton
                icon={<LaneCornerRight />}
                onClick={() => toggleTempCondition('onCornerRight')}
              />
              <PickerButton
                icon={<LaneCornerDown />}
                onClick={() => toggleTempCondition('onCornerDown')}
              />
              <PickerButton
                icon={<LaneCornerLeft />}
                onClick={() => toggleTempCondition('onCornerLeft')}
              />
            </div>
          )}

          {/* IF – THEN */}
          {picker === 'if-then' && tempIfConditions.length > 0 && (
            <div className="flex justify-center gap-4 flex-wrap">
              {tempIfConditions[0]?.startsWith('onCorner') ? (
                // corners: only allow turning actions
                <>
                  <PickerButton
                    icon={<ArrowLeft />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions[0],
                        then: { type: 'action', action: 'left' },
                      })
                    }
                  />
                  <PickerButton
                    icon={<ArrowRight />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions[0],
                        then: { type: 'action', action: 'right' },
                      })
                    }
                  />
                </>
              ) : tempIfConditions[0] === 'onData' ? (
                // data: pickup or turn
                <>
                  <PickerButton
                    icon={<PickUp />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions[0],
                        then: { type: 'action', action: 'pickup' },
                      })
                    }
                  />
                  <PickerButton
                    icon={<ArrowLeft />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions[0],
                        then: { type: 'action', action: 'left' },
                      })
                    }
                  />
                  <PickerButton
                    icon={<ArrowRight />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions[0],
                        then: { type: 'action', action: 'right' },
                      })
                    }
                  />
                </>
              ) : tempIfConditions[0] === 'onEmpty' ? (
                // empty: putdown or turn
                <>
                  <PickerButton
                    icon={<PutDown />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions[0],
                        then: { type: 'action', action: 'putdown' },
                      })
                    }
                  />
                  <PickerButton
                    icon={<ArrowLeft />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions[0],
                        then: { type: 'action', action: 'left' },
                      })
                    }
                  />
                  <PickerButton
                    icon={<ArrowRight />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions[0],
                        then: { type: 'action', action: 'right' },
                      })
                    }
                  />
                </>
              ) : (
                // fallback: full actions
                <>
                  <PickerButton
                    icon={<PickUp />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions.length === 1 ? tempIfConditions[0] : tempIfConditions,
                        then: { type: 'action', action: 'pickup' },
                      })
                    }
                  />
                  <PickerButton
                    icon={<PutDown />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions.length === 1 ? tempIfConditions[0] : tempIfConditions,
                        then: { type: 'action', action: 'putdown' },
                      })
                    }
                  />
                  <PickerButton
                    icon={<ArrowLeft />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions.length === 1 ? tempIfConditions[0] : tempIfConditions,
                        then: { type: 'action', action: 'left' },
                      })
                    }
                  />
                  <PickerButton
                    icon={<ArrowRight />}
                    onClick={() =>
                      commitNode({
                        type: 'if',
                        condition: tempIfConditions.length === 1 ? tempIfConditions[0] : tempIfConditions,
                        then: { type: 'action', action: 'right' },
                      })
                    }
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
