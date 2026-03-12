'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Clock, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OrderStatusTracker from '@/components/OrderStatusTracker'
import { formatPrice, formatDateTime, statusLabel, getPickupCode } from '@/lib/utils'
import type { OrderWithItems, OrderStatus } from '@/types'

interface OrderDetailClientProps {
  order: OrderWithItems
}

export default function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const supabase = createClient()
  const [order, setOrder] = useState(initialOrder)

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await fetch(`/api/orders/${order.id}`)
      if (res.ok) {
        const data = await res.json()
        // Only update state if status or updated_at changed
        setOrder(prev => {
          if (prev.status === data.status && prev.updated_at === data.updated_at) return prev
          return data
        })
      }
    }

    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          setOrder(prev => ({ ...prev, ...(payload.new as Partial<OrderWithItems>) }))
        }
      )
      .subscribe()

    // Polling every 5s as fallback
    const interval = setInterval(fetchOrder, 5_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [order.id])

  const paymentLabel = order.payment_method === 'school_credit' ? 'Školní kredit' : 'Platební karta'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 pb-28 sm:pb-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/orders" className="p-2 rounded-xl hover:bg-warm-100 text-warm-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-900">Detail objednávky</h1>
          <p className="text-warm-400 text-sm">#{order.id.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Pickup code — always visible, prominent */}
        {(() => {
          const code = order.pickup_code || getPickupCode(order.id)
          return (
            <div className={`rounded-3xl p-5 text-center border-2 ${
              (order.status === 'ready' || order.status === 'preparing')
                ? 'bg-green-50 border-green-300 animate-pulse'
                : 'bg-peach-50 border-peach-200'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <Hash className={`w-4 h-4 ${(order.status === 'ready' || order.status === 'preparing') ? 'text-green-600' : 'text-peach-500'}`} />
                <p className={`text-xs font-semibold uppercase tracking-widest ${(order.status === 'ready' || order.status === 'preparing') ? 'text-green-600' : 'text-peach-500'}`}>
                  {(order.status === 'ready' || order.status === 'preparing') ? '🎉 Tvůj kód k vyzvednutí' : 'Kód objednávky'}
                </p>
              </div>
              <p className={`font-display font-bold tracking-[0.3em] text-5xl mt-1 ${
                (order.status === 'ready' || order.status === 'preparing') ? 'text-green-700' : 'text-warm-900'
              }`}>
                {code}
              </p>
              <p className="text-warm-400 text-xs mt-2">Ukaž tento kód u výdejního okénka</p>
            </div>
          )
        })()}

        {/* Status tracker */}
        <OrderStatusTracker status={order.status as OrderStatus} />

        {/* Estimated time */}
        {order.estimated_ready_at && order.status !== 'picked_up' && order.status !== 'cancelled' && (
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Odhadovaná doba připravení</p>
              <p className="text-amber-700 font-bold">{formatDateTime(order.estimated_ready_at)}</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-3xl border border-warm-100 shadow-card p-5">
          <h2 className="font-display font-bold text-warm-900 mb-4">Položky</h2>
          <div className="space-y-3">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-warm-50 flex-shrink-0">
                  {item.products?.image_url ? (
                    <Image src={item.products.image_url} alt={item.products.name} width={48} height={48} className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-warm-900">{item.products?.name}</p>
                  <p className="text-warm-400 text-sm">× {item.quantity} · {formatPrice(item.unit_price)} ks</p>
                </div>
                <p className="font-bold text-warm-800">{formatPrice(item.unit_price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-warm-100 mt-4 pt-4 flex items-center justify-between">
            <span className="text-warm-600 font-medium">Celkem</span>
            <span className="font-display font-bold text-warm-900 text-xl">{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        {/* Order details */}
        <div className="bg-white rounded-3xl border border-warm-100 shadow-card p-5">
          <h2 className="font-display font-bold text-warm-900 mb-3">Podrobnosti</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-500">Číslo objednávky</span>
              <span className="font-mono text-warm-800">#{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-500">Stav</span>
              <span className="font-semibold text-warm-800">{statusLabel(order.status as OrderStatus)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-500">Platba</span>
              <span className="font-semibold text-warm-800">{paymentLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-500">Vytvořeno</span>
              <span className="text-warm-800">{formatDateTime(order.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
