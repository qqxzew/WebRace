'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Coffee, Utensils, Cookie, Box, ChevronDown } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types'

interface CatalogClientProps {
  products: Product[]
  isLoggedIn: boolean
}

const CATEGORIES = [
  { value: 'all', label: 'Vše', icon: <ChevronDown className="w-4 h-4" /> },
  { value: 'food', label: 'Jídlo', icon: <Utensils className="w-4 h-4" /> },
  { value: 'drink', label: 'Pití', icon: <Coffee className="w-4 h-4" /> },
  { value: 'snack', label: 'Svačina', icon: <Cookie className="w-4 h-4" /> },
  { value: 'other', label: 'Ostatní', icon: <Box className="w-4 h-4" /> },
]

export default function CatalogClient({ products: initialProducts, isLoggedIn }: CatalogClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  // Fetch fresh available products — only update state if data actually changed
  const fetchProducts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('category')
      .order('name')
    if (data) {
      setProducts(prev => {
        // Compare by stringifying IDs + updated_at to avoid re-render when nothing changed
        const prevSig = prev.map(p => p.id + p.updated_at).join(',')
        const nextSig = data.map((p: Product) => p.id + (p as any).updated_at).join(',')
        return prevSig === nextSig ? prev : data as Product[]
      })
    }
  }

  useEffect(() => {
    const supabase = createClient()

    // Realtime — refetch on any product change (works if Realtime publication includes products table)
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts()
      })
      .subscribe()

    // Polling every 5s — reliable fallback regardless of Realtime configuration
    const interval = setInterval(fetchProducts, 5_000)

    // Also refetch when user comes back to the tab
    const onFocus = () => fetchProducts()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) fetchProducts()
    })

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [products, activeCategory, search])

  return (
    <div>
      {/* Search + categories */}
      <div className="flex flex-col gap-3 mb-6 sm:mb-8">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hledat..."
            className="input-base pl-10 text-base"
          />
        </div>

        {/* Category tabs — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-hide snap-x snap-mandatory">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 flex-shrink-0 snap-start whitespace-nowrap ${
                activeCategory === cat.value
                  ? 'bg-peach-500 text-white shadow-warm'
                  : 'bg-white text-warm-600 border border-warm-200 hover:border-peach-300 hover:text-peach-500'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid — 2 columns on mobile, up to 4 on xl */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl">😕</span>
          <p className="font-display font-bold text-warm-700 text-xl mt-4">
            {search ? 'Nic nenalezeno' : 'Momentálně nic v nabídce'}
          </p>
          <p className="text-warm-400 mt-2">
            {search ? 'Zkus jiný název' : 'Zkus to znovu později'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {filtered.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>
      )}
    </div>
  )
}
