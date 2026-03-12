'use client'

import { useState } from 'react'
import { UtensilsCrossed, ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function SetupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/admin-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    })

    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-peach-50 via-[#fffef7] to-cream-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-peach-500 rounded-3xl shadow-warm mb-4">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-warm-900">Nastavení admina</h1>
          <p className="text-warm-500 mt-1">Jednorázové vytvoření admin účtu</p>
        </div>

        <div className="bg-white rounded-4xl shadow-card-hover border border-warm-100 p-8">
          {!result?.success ? (
            <>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-sm text-amber-800">
                <p className="font-semibold mb-1">⚠️ Před použitím:</p>
                <p>Přidej do <code className="bg-amber-100 px-1 rounded">.env.local</code>:</p>
                <code className="block mt-1 text-xs bg-amber-100 p-2 rounded">
                  SUPABASE_SERVICE_ROLE_KEY=tvůj_klíč
                </code>
                <p className="mt-1">Klíč najdeš na: Supabase Dashboard → Project Settings → API</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-2">Celé jméno</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Andrii"
                    required
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@skola.cz"
                    required
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-2">Heslo</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="min. 6 znaků"
                    required
                    className="input-base"
                  />
                </div>

                {result?.error && (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-red-700 text-sm">
                    ❌ {result.error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Vytvořit admin účet
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-display font-bold text-warm-900 text-xl mb-2">Hotovo! 🎉</h2>
              <p className="text-warm-600 mb-6">{result.message}</p>
              <Link href="/login" className="btn-primary inline-flex items-center gap-2">
                Přihlásit se
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
