'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { formatPrice } from '@/lib/utils'
import { BarChart3, TrendingUp } from 'lucide-react'

type ProductStats = { name: string; count: number; revenue: number }
type DayStats = { date: string; orders: number; revenue: number }

export default function AdminAnalyticsPage() {
  const [productStats, setProductStats] = useState<ProductStats[]>([])
  const [dayStats, setDayStats] = useState<DayStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/analytics')
      if (res.ok) {
        const data = await res.json()
        setProductStats(data.productStats)
        setDayStats(data.dayStats)
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalRevenue = dayStats.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = dayStats.reduce((s, d) => s + d.orders, 0)

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-warm-100 rounded-2xl shimmer" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-3xl shimmer" />)}
        </div>
        <div className="h-80 bg-white rounded-3xl shimmer" />
        <div className="h-80 bg-white rounded-3xl shimmer" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="w-6 h-6 text-peach-500" />
        <div>
          <h1 className="font-display text-3xl font-bold text-warm-900">Analýzy</h1>
          <p className="text-warm-500 mt-0.5">Statistiky za posledních 14 dní</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-3xl border border-warm-100 shadow-card p-5">
          <TrendingUp className="w-8 h-8 text-green-500 mb-2" />
          <p className="font-display font-bold text-warm-900 text-2xl">{formatPrice(totalRevenue)}</p>
          <p className="text-warm-600 font-semibold text-sm">Tržby (14 dní)</p>
        </div>
        <div className="bg-white rounded-3xl border border-warm-100 shadow-card p-5">
          <BarChart3 className="w-8 h-8 text-blue-500 mb-2" />
          <p className="font-display font-bold text-warm-900 text-2xl">{totalOrders}</p>
          <p className="text-warm-600 font-semibold text-sm">Objednávek (14 dní)</p>
        </div>
      </div>

      {/* Daily orders chart */}
      <div className="bg-white rounded-3xl border border-warm-100 shadow-card p-5 mb-6">
        <h2 className="font-display font-bold text-warm-900 mb-4">Objednávky za den</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={dayStats} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e2cc" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9a8878' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9a8878' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #f0e2cc', fontFamily: 'var(--font-dm-sans)' }}
              formatter={(value: number, name: string) => [
                name === 'revenue' ? formatPrice(value) : value,
                name === 'revenue' ? 'Tržby' : 'Objednávky'
              ]}
            />
            <Legend formatter={val => val === 'orders' ? 'Objednávky' : 'Tržby (Kč)'} />
            <Line type="monotone" dataKey="orders" stroke="#ff7520" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Popular products */}
      <div className="bg-white rounded-3xl border border-warm-100 shadow-card p-5">
        <h2 className="font-display font-bold text-warm-900 mb-4">Nejprodávanější produkty</h2>
        {productStats.length === 0 ? (
          <p className="text-warm-400 text-sm text-center py-8">Žádná data</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productStats} layout="vertical" margin={{ top: 5, right: 40, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e2cc" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9a8878' }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#9a8878' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #f0e2cc', fontFamily: 'var(--font-dm-sans)' }}
                formatter={(value: number) => [value, 'Prodaných ks']}
              />
              <Bar dataKey="count" fill="#ff7520" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
