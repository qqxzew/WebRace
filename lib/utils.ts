import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} Kč`
}

export function formatDistanceToNow(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'Právě teď'
  if (diffMin < 60) return `Před ${diffMin} min`
  if (diffHour < 24) return `Před ${diffHour} hod`
  return `Před ${diffDay} dny`
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function statusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Přijato',
    confirmed: 'Přijato',
    preparing: 'Hotovo! 🎉',
    ready: 'Hotovo! 🎉',
    picked_up: 'Vydáno',
    cancelled: 'Zrušeno',
  }
  return labels[status]
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    food: 'Jídlo',
    drink: 'Pití',
    snack: 'Svačina',
    other: 'Ostatní',
  }
  return labels[category] ?? category
}

export function nextStatus(status: OrderStatus): OrderStatus | null {
  // Simplified 3-step flow: Přijato → Hotovo → Vydáno
  const flow: Partial<Record<OrderStatus, OrderStatus>> = {
    pending: 'preparing',
    confirmed: 'preparing',
    preparing: 'picked_up',
    ready: 'picked_up',
  }
  return flow[status] ?? null
}

/**
 * Derives a deterministic 6-char pickup code from an order ID.
 * Format: 3 uppercase letters + 3 digits, shuffled by a seeded hash.
 * Same order ID always produces the same code — no DB column needed.
 */
export function getPickupCode(orderId: string): string {
  // Simple seeded hash of the UUID
  let h = 0
  for (let i = 0; i < orderId.length; i++) {
    h = Math.imul(31, h) + orderId.charCodeAt(i) | 0
  }
  const abs = Math.abs(h)

  const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const DIGITS = '0123456789'

  // Pick 3 letters and 3 digits from the hash
  const seed = (n: number, salt: number) => Math.abs(Math.imul(abs + salt, 0x9e3779b9) >>> 0)
  const chars = [
    LETTERS[seed(abs, 1) % LETTERS.length],
    LETTERS[seed(abs, 2) % LETTERS.length],
    LETTERS[seed(abs, 3) % LETTERS.length],
    DIGITS[seed(abs, 4) % 10],
    DIGITS[seed(abs, 5) % 10],
    DIGITS[seed(abs, 6) % 10],
  ]

  // Shuffle deterministically using Fisher-Yates with seeded rng
  for (let i = 5; i > 0; i--) {
    const j = seed(abs, i + 10) % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}
