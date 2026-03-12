'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { UtensilsCrossed, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Nesprávný email nebo heslo')
      setLoading(false)
      return
    }

    toast.success('Vítej zpět!')
    router.push('/')
    router.refresh()
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
          <h2 className="font-display text-2xl font-bold text-warm-900 mb-6">Přihlásit se</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tvuj@email.cz"
                required
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
                  placeholder="••••••••"
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
                  Přihlásit se
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-warm-500 mt-6 text-sm">
            Ještě nemáš účet?{' '}
            <Link href="/register" className="text-peach-500 font-semibold hover:text-peach-600">
              Registrovat se
            </Link>
          </p>
        </div>

        <p className="text-center text-warm-400 text-xs mt-6">
          Jídelna Plus © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
