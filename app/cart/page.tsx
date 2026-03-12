'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ArrowRight, ShoppingCart, ArrowLeft } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemCount, _hasHydrated } = useCartStore()
  const cartTotal = total()
  const count = itemCount()

  // Wait for localStorage hydration before showing empty state
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#fffef7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-peach-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffef7]">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 pb-28 sm:pb-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="p-2 rounded-xl hover:bg-warm-100 text-warm-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-3xl font-bold text-warm-900">Košík</h1>
          {count > 0 && (
            <span className="bg-peach-100 text-peach-600 text-sm font-semibold px-2.5 py-1 rounded-full">
              {count} {count === 1 ? 'položka' : count < 5 ? 'položky' : 'položek'}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-warm-50 rounded-4xl flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-warm-300" />
            </div>
            <p className="font-display font-bold text-warm-700 text-xl">Košík je prázdný</p>
            <p className="text-warm-400 mt-2 mb-6">Přidej si něco dobrého</p>
            <Link href="/" className="btn-primary inline-flex items-center gap-2">
              Procházet nabídku
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mb-4">
            {items.map(item => (
              <div
                key={item.product.id}
                className="bg-white rounded-3xl border border-warm-100 shadow-card p-4 flex items-center gap-4"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-warm-50 flex-shrink-0">
                  {item.product.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-warm-900">{item.product.name}</h3>
                  <p className="text-peach-500 font-bold">{formatPrice(item.product.price)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-8 h-8 bg-warm-100 hover:bg-red-100 hover:text-red-500 text-warm-600 rounded-xl flex items-center justify-center transition-colors"
                  >
                    {item.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  </button>
                  <span className="w-8 text-center font-bold text-warm-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-8 h-8 bg-peach-500 hover:bg-peach-600 text-white rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right w-20">
                  <p className="font-bold text-warm-900">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}

            {/* Summary — sticky on mobile */}
            <div className="hidden sm:block bg-white rounded-3xl border border-warm-100 shadow-card p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-warm-600 font-medium">Celkem</span>
                <span className="font-display font-bold text-warm-900 text-2xl">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <Link
                href="/checkout"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Pokračovat k platbě
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Sticky checkout bar — mobile only */}
            <div className="sm:hidden fixed bottom-16 left-0 right-0 z-30 px-4 pb-3 pt-3 bg-white/95 backdrop-blur-md border-t border-warm-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-warm-600 font-medium text-sm">Celkem</span>
                <span className="font-display font-bold text-warm-900 text-xl">{formatPrice(cartTotal)}</span>
              </div>
              <Link
                href="/checkout"
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              >
                Pokračovat k platbě
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
