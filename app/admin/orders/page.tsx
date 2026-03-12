'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatDateTime, statusLabel, nextStatus, getPickupCode } from '@/lib/utils'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import type { OrderStatus } from '@/types'

type AdminOrder = {
  id: string
  user_id: string
  status: OrderStatus
  total_amount: number
  payment_method: string
  created_at: string
  pickup_code: string | null
  profiles: { full_name: string; class: string | null } | null
  order_items: { quantity: number; products: { name: string; image_url: string | null } | null }[]
}

const TABS = [
  { value: 'active', label: 'Aktivni' },
  { value: 'picked_up', label: 'Vyzvednuto' },
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const res = await fetch(`/api/admin/orders?status=${tab === 'active' ? 'active' : 'picked_up'}`)
    const data = await res.json()
    if (!silent) {
      setOrders(Array.isArray(data) ? data : [])
      setLoading(false)
    } else {
      // Silent poll — only update if something changed (compare IDs+statuses)
      if (Array.isArray(data)) {
        setOrders(prev => {
          const prevSig = prev.map(o => o.id + o.status).join(',')
          const nextSig = data.map((o: AdminOrder) => o.id + o.status).join(',')
          return prevSig === nextSig ? prev : data
        })
      }
    }
  }, [tab])

  const loadRef = useRef(load)
  useEffect(() => { loadRef.current = load }, [load])

  useEffect(() => { load() }, [load])

  // Realtime — reload list on any order change
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadRef.current()
      })
      .subscribe()

    // Polling every 5s as fallback (silent — no loading spinner)
    const interval = setInterval(() => loadRef.current(true), 5_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const advanceStatus = async (order: AdminOrder) => {
    const next = nextStatus(order.status)
    if (!next) return
    const res = await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: order.id, status: next }),
    })
    if (!res.ok) { toast.error('Chyba pri aktualizaci'); return }
    toast.success(`Stav zmenen na: ${statusLabel(next)}`)
    load()
  }

  const statusClass: Record<string, string> = {
    pending: 'status-pending',
    confirmed: 'status-pending',
    preparing: 'status-ready',
    ready: 'status-ready',
    picked_up: 'status-picked_up',
    cancelled: 'status-cancelled',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-warm-900">Objednavky</h1>
        <p className="text-warm-500 mt-1">Sprava a aktualizace stavu</p>
      </div>

      <div className="flex gap-1 mb-6 bg-warm-100 rounded-2xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.value
                ? 'bg-white text-peach-600 shadow-sm'
                : 'text-warm-500 hover:text-warm-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-3xl h-24 shimmer" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display font-bold text-warm-700 text-xl">
            {tab === 'active' ? 'Zadne aktivni objednavky' : 'Zadne vyzvednuté objednavky'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const next = nextStatus(order.status)
            const code = order.pickup_code?.toUpperCase() || getPickupCode(order.id)
            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-warm-100 shadow-card p-4 opacity-0 animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-peach-50 border border-peach-200 rounded-2xl px-3 py-2 text-center flex-shrink-0 min-w-[4.5rem]">
                    <p className="font-mono font-bold text-base tracking-wider text-peach-700 leading-none">{code}</p>
                    <p className="text-peach-400 text-[10px] mt-0.5">kod</p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-semibold text-warm-900">
                        {order.profiles?.full_name ?? 'Neznamy'}
                        {order.profiles?.class && (
                          <span className="text-warm-400 font-normal ml-1.5 text-sm">({order.profiles.class})</span>
                        )}
                      </p>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusClass[order.status]}`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>

                    {/* Product thumbnails */}
                    <div className="flex items-center gap-1.5 my-1.5 flex-wrap">
                      {order.order_items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-warm-50 rounded-xl px-2 py-1">
                          <div className="w-7 h-7 rounded-lg bg-white border border-warm-100 flex-shrink-0 overflow-hidden">
                            {item.products?.image_url ? (
                              <Image
                                src={item.products.image_url}
                                alt={item.products.name ?? ''}
                                width={28}
                                height={28}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-warm-300">?</div>
                            )}
                          </div>
                          <span className="text-xs text-warm-700 font-medium">{item.products?.name ?? '?'}</span>
                          {item.quantity > 1 && <span className="text-xs text-warm-400">×{item.quantity}</span>}
                        </div>
                      ))}
                    </div>

                    <p className="text-warm-400 text-xs mt-0.5">{formatDateTime(order.created_at)}</p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="font-bold text-warm-900">{formatPrice(Number(order.total_amount))}</p>
                    {next && (
                      <button
                        onClick={() => advanceStatus(order)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-peach-500 hover:bg-peach-600 text-white text-xs font-semibold rounded-xl shadow-warm active:scale-95 transition-all whitespace-nowrap"
                      >
                        {statusLabel(next)}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}