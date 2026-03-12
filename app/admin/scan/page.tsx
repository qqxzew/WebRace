'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, CheckCircle2, Clock, Package, XCircle, ChevronRight, RotateCcw } from 'lucide-react'
import { formatPrice, statusLabel, nextStatus, getPickupCode } from '@/lib/utils'
import { toast } from 'sonner'
import Image from 'next/image'
import type { OrderStatus } from '@/types'

type ScannedOrder = {
  id: string
  status: OrderStatus
  total_amount: number
  payment_method: string
  pickup_code: string | null
  created_at: string
  profiles: { full_name: string; class: string | null } | null
  order_items: {
    id: string
    quantity: number
    unit_price: number
    products: { name: string; image_url: string | null } | null
  }[]
}

export default function AdminScanPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<ScannedOrder | null>(null)
  const [notFound, setNotFound] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  const lookup = async (searchCode = code) => {
    if (searchCode.length < 4) return
    setLoading(true)
    setNotFound(false)
    setOrder(null)

    const res = await fetch(`/api/admin/scan?code=${encodeURIComponent(searchCode)}`)
    if (res.status === 404) {
      setNotFound(true)
    } else if (res.ok) {
      const data = await res.json()
      setOrder(data)
    } else {
      toast.error('Chyba při hledání')
    }
    setLoading(false)
  }

  const advance = async () => {
    if (!order) return
    const next = nextStatus(order.status)
    if (!next) return

    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: order.id, status: next }),
    })
    if (!res.ok) { toast.error('Chyba'); return }

    if (next === 'picked_up') {
      toast.success('✅ Objednávka vydána!')
      setOrder(null)
      setCode('')
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      toast.success(`Stav: ${statusLabel(next)}`)
      setOrder(prev => prev ? { ...prev, status: next } : null)
    }
  }

  const reset = () => {
    setOrder(null)
    setNotFound(false)
    setCode('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const displayCode = order ? (order.pickup_code?.toUpperCase() || getPickupCode(order.id)) : null

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
    preparing: 'bg-orange-100 text-orange-700 border-orange-200',
    ready: 'bg-green-100 text-green-700 border-green-200',
    picked_up: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-warm-900">Výdejna</h1>
        <p className="text-warm-500 mt-1">Zadej kód objednávky pro vyzvednutí</p>
      </div>

      {/* Code input */}
      <div className="bg-white rounded-3xl border-2 border-warm-200 shadow-card p-6 mb-6">
        <label className="block text-xs font-semibold text-warm-500 uppercase tracking-widest mb-3">
          Kód objednávky
        </label>
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={e => {
              const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
              setCode(v)
              setNotFound(false)
              if (v.length === 6) lookup(v)
            }}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="např. MX3E74"
            className="flex-1 font-mono font-bold text-3xl text-center tracking-[0.25em] uppercase bg-warm-50 border-2 border-warm-200 rounded-2xl px-4 py-4 focus:outline-none focus:border-peach-400 focus:bg-white transition-colors placeholder:text-warm-200 placeholder:text-2xl"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={() => lookup()}
            disabled={loading || code.length < 4}
            className="px-5 py-4 bg-peach-500 hover:bg-peach-600 disabled:opacity-40 text-white rounded-2xl transition-all active:scale-95 shadow-warm"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Search className="w-5 h-5" />
            }
          </button>
        </div>

        {/* Character hints */}
        <div className="flex gap-2 mt-3 justify-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-9 h-1.5 rounded-full transition-all ${
                code[i] ? 'bg-peach-400' : 'bg-warm-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Not found */}
      {notFound && (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center">
          <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="font-display font-bold text-red-700">Kód nenalezen</p>
          <p className="text-red-500 text-sm mt-1">Zkontroluj kód nebo objednávka už byla vyzvednuta</p>
          <button onClick={reset} className="mt-4 flex items-center gap-2 mx-auto text-sm text-red-500 hover:text-red-700 font-semibold">
            <RotateCcw className="w-4 h-4" /> Zkusit znovu
          </button>
        </div>
      )}

      {/* Order found */}
      {order && (
        <div className="bg-white rounded-3xl border-2 border-warm-100 shadow-card overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-peach-50 to-amber-50 border-b border-warm-100 px-6 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono font-bold text-2xl tracking-widest text-warm-900">{displayCode}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor[order.status]}`}>
                  {statusLabel(order.status)}
                </span>
              </div>
              <p className="font-display font-bold text-warm-900 text-lg">
                {order.profiles?.full_name ?? 'Neznámý'}
                {order.profiles?.class && (
                  <span className="text-warm-400 font-normal text-sm ml-2">({order.profiles.class})</span>
                )}
              </p>
            </div>
            <button onClick={reset} className="p-2 rounded-xl hover:bg-warm-100 text-warm-400 transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div className="p-6 space-y-3">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex-shrink-0 flex items-center justify-center border border-warm-100">
                  {item.products?.image_url
                    ? <Image src={item.products.image_url} alt={item.products?.name ?? ''} width={48} height={48} className="w-full h-full object-contain" unoptimized />
                    : <div className="text-xl">🍽️</div>
                  }
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-warm-900">{item.products?.name}</p>
                  <p className="text-warm-400 text-sm">× {item.quantity}</p>
                </div>
                <p className="font-bold text-warm-700">{formatPrice(item.unit_price * item.quantity)}</p>
              </div>
            ))}

            <div className="border-t border-warm-100 pt-3 flex justify-between items-center">
              <div className="flex items-center gap-2 text-warm-500 text-sm">
                {order.payment_method === 'school_credit'
                  ? <><Package className="w-4 h-4" /> Školní kredit</>
                  : <><Package className="w-4 h-4" /> Karta</>
                }
              </div>
              <p className="font-display font-bold text-warm-900 text-xl">{formatPrice(Number(order.total_amount))}</p>
            </div>
          </div>

          {/* Action */}
          <div className="px-6 pb-6">
            {order.status === 'ready' ? (
              <button
                onClick={advance}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-display font-bold text-lg rounded-2xl shadow-lg active:scale-98 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 className="w-6 h-6" />
                Vydat objednávku ✓
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-sm">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Objednávka ještě není připravena — stav: <strong>{statusLabel(order.status)}</strong></span>
                </div>
                {nextStatus(order.status) && (
                  <button
                    onClick={advance}
                    className="w-full py-3 bg-peach-500 hover:bg-peach-600 text-white font-semibold rounded-2xl shadow-warm active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Posunout na: {statusLabel(nextStatus(order.status)!)}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
