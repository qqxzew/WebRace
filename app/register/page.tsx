'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { UtensilsCrossed, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [className, setClassName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Heslo musí mít alespoň 6 znaků')
      return
    }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          class: className || null,
        },
      },
    })

    if (error) {
      const msg = error.message
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        toast.error('Tento email je již zaregistrován')
      } else if (msg.includes('email_address_invalid') || msg.includes('invalid')) {
        toast.error('Neplatná emailová adresa — použij svůj skutečný email (např. jmeno@gmail.com)')
      } else if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
        toast.error('Limit odeslaných emailů — vypni "Confirm email" v Supabase → Authentication → Providers')
      } else {
        toast.error(`Chyba registrace: ${msg}`)
      }
      setLoading(false)
      return
    }

    if (data.user && data.session) {
      // Manually create profile in case DB trigger is not set up
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role: 'student',
        school_credit: 0,
        class: className || null,
      })
      toast.success('Účet vytvořen! Vítej v Školním Bufetu 🎉')
      router.push('/')
      router.refresh()
    } else if (data.user && !data.session) {
      // Email confirmation required
      toast.success('Zkontroluj email a klikni na potvrzovací odkaz!')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-peach-50 via-[#fffef7] to-cream-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-peach-500 rounded-3xl shadow-warm mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-warm-900">Jídelna Plus</h1>
          <p className="text-warm-500 mt-1">Objednej si svačinu online</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-4xl shadow-card-hover border border-warm-100 p-8">
          <h2 className="font-display text-2xl font-bold text-warm-900 mb-6">Vytvořit účet</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-2">
                Celé jméno
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jan Novák"
                required
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jan.novak@skola.cz"
                required
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-2">
                Třída <span className="text-warm-400 font-normal">(nepovinné)</span>
              </label>
              <input
                type="text"
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="3.A"
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-2">
                Heslo
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="min. 6 znaků"
                  required
                  className="input-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Vytvořit účet
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-warm-500 mt-6 text-sm">
            Už máš účet?{' '}
            <Link href="/login" className="text-peach-500 font-semibold hover:text-peach-600">
              Přihlásit se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
