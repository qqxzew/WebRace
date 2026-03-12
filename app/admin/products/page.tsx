'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Check } from 'lucide-react'
import { formatPrice, categoryLabel } from '@/lib/utils'
import { toast } from 'sonner'
import type { Product } from '@/types'

const EMPTY_PRODUCT: Omit<Product, 'id' | 'created_at'> = {
  name: '',
  description: '',
  price: 0,
  image_url: '',
  category: 'food',
  is_available: false,
  preparation_time_min: 5,
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch('/api/admin/products')
    const data = await res.json()
    setProducts(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingProduct(null)
    setForm(EMPTY_PRODUCT)
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      image_url: product.image_url ?? '',
      category: product.category,
      is_available: product.is_available,
      preparation_time_min: product.preparation_time_min,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || form.price <= 0) {
      toast.error('Vyplň název a cenu')
      return
    }
    setSaving(true)

    const payload = {
      ...form,
      description: form.description || null,
      image_url: (form.image_url as string) || null,
      price: Number(form.price),
      preparation_time_min: Number(form.preparation_time_min),
    }

    if (editingProduct) {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProduct.id, ...payload }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Uložení selhalo'); setSaving(false); return }
      toast.success('Produkt upraven')
    } else {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Vytvoření selhalo'); setSaving(false); return }
      toast.success('Produkt vytvořen')
    }

    setSaving(false)
    setModalOpen(false)
    load()
  }

  const toggleAvailability = async (product: Product) => {
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, is_available: !product.is_available }),
    })
    if (!res.ok) { toast.error('Chyba'); return }
    setProducts(prev =>
      prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p)
    )
    toast.success(product.is_available ? 'Produkt skryt' : 'Produkt aktivován')
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Opravdu smazat tento produkt?')) return
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { toast.error('Smazání selhalo'); return }
    toast.success('Produkt smazán')
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-warm-900">Produkty</h1>
          <p className="text-warm-500 mt-1">{products.length} produktů</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Přidat produkt
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl h-48 shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div
              key={product.id}
              className={`bg-white rounded-3xl border shadow-card overflow-hidden ${
                product.is_available ? 'border-warm-100' : 'border-warm-200 opacity-70'
              }`}
            >
              {/* Image */}
              <div className="aspect-square w-full bg-white flex items-center justify-center overflow-hidden relative">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-contain" unoptimized />
                ) : (
                  <div className="text-4xl opacity-40">
                    {product.category === 'food' ? '🍕' : product.category === 'drink' ? '🥤' : product.category === 'snack' ? '🥨' : '📦'}
                  </div>
                )}

                {/* Availability toggle */}
                <button
                  onClick={() => toggleAvailability(product)}
                  className={`absolute top-2 right-2 px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                    product.is_available
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {product.is_available ? (
                    <><ToggleRight className="w-3.5 h-3.5" /> Aktivní</>
                  ) : (
                    <><ToggleLeft className="w-3.5 h-3.5" /> Neaktivní</>
                  )}
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-warm-900 truncate">{product.name}</p>
                    <p className="text-warm-400 text-xs">{categoryLabel(product.category)}</p>
                  </div>
                  <p className="font-bold text-peach-500 flex-shrink-0">{formatPrice(product.price)}</p>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 text-sm font-semibold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Upravit
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-4xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
              <h2 className="font-display font-bold text-warm-900 text-xl">
                {editingProduct ? 'Upravit produkt' : 'Nový produkt'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl hover:bg-warm-100 text-warm-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-2">Název *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-base" placeholder="Bramborák" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-2">Popis</label>
                <textarea value={form.description as string} onChange={e => setForm({ ...form, description: e.target.value })} className="input-base h-20 resize-none" placeholder="Krátký popis..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-2">Cena (Kč) *</label>
                  <input type="text" inputMode="decimal" value={form.price === 0 ? '' : form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value.replace(',', '.')) || 0 })} className="input-base no-spinner" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-2">Příprava (min)</label>
                  <input type="text" inputMode="numeric" value={form.preparation_time_min === 0 ? '' : form.preparation_time_min} onChange={e => setForm({ ...form, preparation_time_min: parseInt(e.target.value) || 5 })} className="input-base no-spinner" placeholder="5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-2">Kategorie</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as Product['category'] })} className="input-base">
                  <option value="food">Jídlo</option>
                  <option value="drink">Pití</option>
                  <option value="snack">Svačina</option>
                  <option value="other">Ostatní</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-2">URL obrázku</label>
                <input type="url" value={form.image_url as string} onChange={e => setForm({ ...form, image_url: e.target.value })} className="input-base" placeholder="https://..." />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_available: !form.is_available })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_available ? 'bg-green-500' : 'bg-warm-200'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_available ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm font-semibold text-warm-700">
                  {form.is_available ? 'Aktivní' : 'Neaktivní'}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
                  Zrušit
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  Uložit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
