'use client'

import { useState, useEffect } from 'react'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { Search, Plus, Minus, Users } from 'lucide-react'
import type { Profile } from '@/types'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creditAmounts, setCreditAmounts] = useState<Record<string, string>>({})

  const load = async () => {
    const res = await fetch('/api/admin/students')
    const data = await res.json()
    setStudents(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = students.filter(s =>
    !search || s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.class ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const addCredit = async (studentId: string) => {
    const amount = parseFloat(creditAmounts[studentId] ?? '0')
    if (!amount || amount <= 0) { toast.error('Zadej platnou částku'); return }

    const res = await fetch('/api/admin/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, action: 'add', amount }),
    })
    if (!res.ok) { toast.error('Přidání kreditu selhalo'); return }

    toast.success(`Přidáno ${formatPrice(amount)}`)
    setCreditAmounts(prev => ({ ...prev, [studentId]: '' }))
    load()
  }

  const deductCredit = async (studentId: string) => {
    const amount = parseFloat(creditAmounts[studentId] ?? '0')
    if (!amount || amount <= 0) { toast.error('Zadej platnou částku'); return }

    const res = await fetch('/api/admin/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, action: 'deduct', amount }),
    })
    const result = await res.json()
    if (!res.ok) { toast.error(result.error ?? 'Odečtení kreditu selhalo'); return }

    toast.success(`Odečteno ${formatPrice(amount)}`)
    setCreditAmounts(prev => ({ ...prev, [studentId]: '' }))
    load()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-peach-500" />
          <h1 className="font-display text-3xl font-bold text-warm-900">Studenti</h1>
        </div>
        <p className="text-warm-500 mt-1">{students.length} registrovaných studentů</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Hledat podle jména nebo třídy..."
          className="input-base pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-3xl h-20 shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-display font-bold text-warm-700 text-xl">
            {search ? 'Žádný student nenalezen' : 'Žádní studenti'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((student, i) => (
            <div
              key={student.id}
              className="bg-white rounded-3xl border border-warm-100 shadow-card p-4 opacity-0 animate-fade-up"
              style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'forwards' }}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 bg-peach-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-peach-600">
                    {student.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-warm-900">{student.full_name}</p>
                  <div className="flex items-center gap-3 text-xs text-warm-400 mt-0.5">
                    {student.class && <span className="bg-warm-100 px-2 py-0.5 rounded-full">{student.class}</span>}
                    <span>Registrace: {formatDateTime(student.created_at)}</span>
                  </div>
                </div>

                {/* Credit */}
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-warm-900">{formatPrice(student.school_credit)}</p>
                  <p className="text-warm-400 text-xs">kredit</p>
                </div>

                {/* Credit controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={creditAmounts[student.id] ?? ''}
                    onChange={e => setCreditAmounts(prev => ({ ...prev, [student.id]: e.target.value }))}
                    placeholder="0"
                    className="w-20 text-center border border-warm-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-peach-300"
                  />
                  <button
                    onClick={() => addCredit(student.id)}
                    title="Přidat kredit"
                    className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deductCredit(student.id)}
                    title="Odečíst kredit"
                    className="w-8 h-8 bg-red-400 hover:bg-red-500 text-white rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
