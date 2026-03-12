'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X, ShoppingCart, Minus, Plus, Trash2, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import Image from 'next/image'

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } = useCartStore()
  const count = itemCount()
  const cartTotal = total()

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-fade-in"
        onClick={closeCart}
      />

      {/* Panel — bottom sheet on mobile, right sidebar on desktop */}
      <div className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-0 sm:right-0 sm:left-auto sm:h-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col animate-slide-in rounded-t-3xl sm:rounded-none max-h-[90vh] sm:max-h-none"
        style={{ animationDirection: 'reverse', animationName: 'slideInRight' }}>
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-warm-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-peach-500" />
            <h2 className="font-display font-bold text-warm-900 text-lg">
              Košík
              {count > 0 && (
                <span className="ml-2 text-sm font-normal text-warm-400">
                  ({count} {count === 1 ? 'položka' : count < 5 ? 'položky' : 'položek'})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-xl hover:bg-warm-100 text-warm-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <div className="w-16 h-16 bg-warm-50 rounded-3xl flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-warm-300" />
              </div>
              <p className="font-display font-bold text-warm-700 text-lg">Košík je prázdný</p>
              <p className="text-warm-400 text-sm mt-1">Přidej si něco dobrého 😋</p>
              <button onClick={closeCart} className="btn-primary mt-6 text-sm py-2.5 px-5">
                Procházet nabídku
              </button>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 bg-warm-50 rounded-2xl p-3 group"
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-warm-100 flex-shrink-0">
                  {item.product.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🍽️
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-warm-900 text-sm truncate">{item.product.name}</p>
                  <p className="text-peach-500 font-bold text-sm">{formatPrice(item.product.price)}</p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 bg-white border border-warm-200 rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors"
                  >
                    {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-warm-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 bg-peach-500 text-white rounded-lg flex items-center justify-center hover:bg-peach-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-warm-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-warm-600 font-medium">Celkem</span>
              <span className="font-display font-bold text-warm-900 text-xl">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Pokračovat k platbě
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="btn-secondary w-full text-center text-sm block"
            >
              Zobrazit košík
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
