'use client'

import { Check, Clock, ChefHat, Package } from 'lucide-react'
import type { OrderStatus } from '@/types'

// 3 visual steps — map DB statuses to step index
const STEPS = [
  { label: 'Přijato', icon: <Clock className="w-5 h-5" />, emoji: '📋' },
  { label: 'Hotovo!', icon: <ChefHat className="w-5 h-5" />, emoji: '👨‍🍳' },
  { label: 'Vydáno', icon: <Package className="w-5 h-5" />, emoji: '🎉' },
]

function statusToStep(status: OrderStatus): number {
  switch (status) {
    case 'pending':
    case 'confirmed':
      return 0
    case 'preparing':
    case 'ready':
      return 1
    case 'picked_up':
      return 2
    default:
      return -1
  }
}

interface OrderStatusTrackerProps {
  status: OrderStatus
}

export default function OrderStatusTracker({ status }: OrderStatusTrackerProps) {
  const currentIndex = statusToStep(status)
  const isCancelled = status === 'cancelled'

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-3xl p-6 text-center">
        <span className="text-4xl">❌</span>
        <p className="font-display font-bold text-red-600 text-lg mt-2">Objednávka zrušena</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-warm-100 shadow-card p-6">
      <h3 className="font-display font-bold text-warm-900 text-lg mb-6">Stav objednávky</h3>

      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="absolute top-5 left-0 right-0 h-1 bg-warm-100 rounded-full" />
        <div
          className="absolute top-5 left-0 h-1 bg-peach-400 rounded-full transition-all duration-700"
          style={{
            width: currentIndex === 0 ? '0%' : `${(currentIndex / (STEPS.length - 1)) * 100}%`,
          }}
        />

        <div className="relative flex justify-between">
          {STEPS.map((step, i) => {
            const isDone = i < currentIndex
            const isActive = i === currentIndex

            return (
              <div key={step.label} className="flex flex-col items-center gap-2" style={{ width: '33.33%' }}>
                <div
                  className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center z-10 transition-all duration-500
                    ${isDone ? 'step-done scale-110' : ''}
                    ${isActive ? 'step-active scale-110 shadow-warm animate-pulse-soft' : ''}
                    ${!isDone && !isActive ? 'step-pending' : ''}
                  `}
                >
                  {isDone ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-lg">{step.emoji}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold text-center leading-tight ${
                    isActive ? 'text-peach-600' : isDone ? 'text-green-600' : 'text-warm-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status message */}
      {(status === 'ready' || status === 'preparing') && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center animate-pulse-soft">
          <p className="font-display font-bold text-green-700 text-lg">
            🎉 Tvoje objednávka je hotová!
          </p>
          <p className="text-green-600 text-sm mt-1">Přijď si ji vyzvednout na buffet</p>
        </div>
      )}
      {status === 'pending' && (
        <div className="bg-warm-50 border border-warm-100 rounded-2xl p-4 text-center">
          <p className="font-display font-bold text-warm-700">
            📋 Objednávka přijata
          </p>
          <p className="text-warm-500 text-sm mt-1">Počkej chvíli, připravujeme tvoji objednávku</p>
        </div>
      )}
    </div>
  )
}
