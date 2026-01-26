// src/components/Game/PickerButton.tsx
// Reusable button for action/condition pickers

'use client'

interface PickerButtonProps {
  icon: React.ReactNode
  onClick: () => void
}

export default function PickerButton({ icon, onClick }: PickerButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        aspect-square w-12
        rounded-md border border-cyan-400/30
        hover:bg-cyan-400/20
        flex items-center justify-center
        p-2
      "
    >
      <div className="w-full h-full">{icon}</div>
    </button>
  )
}
