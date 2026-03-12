'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Wallet, Check, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import type { Profile } from '@/types'
import Image from 'next/image'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart, _hasHydrated } = useCartStore()
  const cartTotal = total()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'school_credit' | 'card'>('school_credit')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch('/api/me')
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const json = await res.json()
      setProfile(json)
    }
    loadProfile()
  }, [])

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#fffef7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-peach-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fffef7] flex items-center justify-center">
        <div className="text-center">
          <p className="font-display font-bold text-warm-700 text-xl">Košík je prázdný</p>
          <Link href="/" className="btn-primary mt-4 inline-flex">Zpět na nabídku</Link>
        </div>
      </div>
    )
  }

  const hasEnoughCredit = profile ? profile.school_credit >= cartTotal : false

  const handleOrder = async () => {
    if (!profile) return
    if (paymentMethod === 'school_credit' && !hasEnoughCredit) {
      toast.error(`Nedostatek kreditu. Máš ${formatPrice(profile.school_credit)}, potřebuješ ${formatPrice(cartTotal)}`)
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, paymentMethod, cartTotal }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Chyba při objednávání')

      clearCart()
      toast.success('Objednávka odeslána! 🎉')
      router.push(`/orders/${result.order_id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Chyba při objednávání'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fffef7]">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/cart" className="p-2 rounded-xl hover:bg-warm-100 text-warm-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-3xl font-bold text-warm-900">Pokladna</h1>
        </div>

        <div className="space-y-5">
          {/* Order summary */}
          <div className="bg-white rounded-3xl border border-warm-100 shadow-card p-5">
            <h2 className="font-display font-bold text-warm-900 mb-4">Shrnutí objednávky</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-warm-50 flex-shrink-0">
                    {item.product.image_url ? (
                      <Image src={item.product.image_url} alt={item.product.name} width={40} height={40} className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-warm-900 text-sm">{item.product.name}</p>
                    <p className="text-warm-400 text-xs">× {item.quantity}</p>
                  </div>
                  <p className="font-bold text-warm-800">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-warm-100 mt-4 pt-4 flex items-center justify-between">
              <span className="font-semibold text-warm-700">Celkem</span>
              <span className="font-display font-bold text-warm-900 text-xl">{formatPrice(cartTotal)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-3xl border border-warm-100 shadow-card p-5">
            <h2 className="font-display font-bold text-warm-900 mb-4">Způsob platby</h2>
            <div className="space-y-3">
              {/* School credit */}
              <button
                onClick={() => setPaymentMethod('school_credit')}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'school_credit'
                    ? 'border-peach-400 bg-peach-50'
                    : 'border-warm-200 hover:border-peach-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  paymentMethod === 'school_credit' ? 'bg-peach-500 text-white' : 'bg-warm-100 text-warm-500'
                }`}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-warm-900">Školní kredit</p>
                  <p className="text-sm text-warm-500">
                    Zůstatek: {profile ? formatPrice(profile.school_credit) : '...'}
                    {!hasEnoughCredit && profile && (
                      <span className="text-red-500 ml-2">— nedostatek</span>
                    )}
                  </p>
                </div>
                {paymentMethod === 'school_credit' && (
                  <Check className="w-5 h-5 text-peach-500" />
                )}
              </button>

              {/* Card */}
              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-peach-400 bg-peach-50'
                    : 'border-warm-200 hover:border-peach-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  paymentMethod === 'card' ? 'bg-peach-500 text-white' : 'bg-warm-100 text-warm-500'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-warm-900">Platební karta</p>
                  <p className="text-sm text-warm-500">Simulovaná platba kartou</p>
                </div>
                {paymentMethod === 'card' && (
                  <Check className="w-5 h-5 text-peach-500" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleOrder}
            disabled={loading || (paymentMethod === 'school_credit' && !hasEnoughCredit)}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Objednat — {formatPrice(cartTotal)}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
