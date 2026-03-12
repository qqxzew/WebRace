'use client'

import Image from 'next/image'
import { Plus, Clock } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  index?: number
  isLoggedIn: boolean
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍕',
  drink: '🥤',
  snack: '🥨',
  other: '📦',
}

export default function ProductCard({ product, index = 0, isLoggedIn }: ProductCardProps) {
  const addItem = useCartStore(s => s.addItem)

  const handleAdd = () => {
    if (!isLoggedIn) {
      toast.error('Nejprve se přihlas')
      return
    }
    addItem(product)
    toast.success(`${product.name} přidáno do košíku`, { duration: 2000 })
  }

  const delay = `${(index % 8) * 0.07}s`

  return (
    <div
      className="product-card bg-white rounded-3xl border border-warm-100 shadow-card overflow-hidden transition-all duration-300 opacity-0 animate-fade-up flex flex-col"
      style={{ animationDelay: delay, animationFillMode: 'forwards' }}
    >
      {/* Product image — always 1:1, letterbox with white bg */}
      <div className="aspect-square w-full bg-white flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={400}
            height={400}
            priority={index < 4}
            className="w-full h-full object-contain"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={product.image_url.includes('unsplash.com')}
          />
        ) : (
          <span className="text-5xl sm:text-6xl opacity-40">
            {CATEGORY_EMOJI[product.category] ?? '🍽️'}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="font-display font-bold text-warm-900 text-base sm:text-lg leading-tight line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-warm-500 text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2 hidden sm:block">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-warm-50">
          <div>
            <p className="font-display font-bold text-peach-500 text-lg sm:text-xl">
              {formatPrice(product.price)}
            </p>
            <div className="flex items-center gap-1 text-warm-400 text-[10px] sm:text-xs mt-0.5">
              <Clock className="w-3 h-3" />
              <span>~{product.preparation_time_min} min</span>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-11 h-11 bg-peach-500 hover:bg-peach-600 text-white rounded-2xl flex items-center justify-center shadow-warm hover:shadow-warm-lg active:scale-90 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
