import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Product popularity
  const { data: orderItems } = await admin
    .from('order_items')
    .select('quantity, unit_price, products(name)')

  const productMap: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const item of orderItems ?? []) {
    const prod = item.products as unknown as { name: string } | { name: string }[] | null
    const name = (Array.isArray(prod) ? prod[0]?.name : prod?.name) ?? 'Neznámý'
    if (!productMap[name]) productMap[name] = { name, count: 0, revenue: 0 }
    productMap[name].count += item.quantity
    productMap[name].revenue += item.unit_price * item.quantity
  }
  const productStats = Object.values(productMap).sort((a, b) => b.count - a.count).slice(0, 10)

  // Orders per day (last 14 days)
  const dayStats = []
  for (let i = 13; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const { data: dayOrders } = await admin
      .from('orders')
      .select('total_amount')
      .gte('created_at', date.toISOString())
      .lte('created_at', end.toISOString())
      .neq('status', 'cancelled')

    dayStats.push({
      date: date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }),
      orders: dayOrders?.length ?? 0,
      revenue: (dayOrders ?? []).reduce((s, o) => s + Number(o.total_amount), 0),
    })
  }

  return NextResponse.json({ productStats, dayStats })
}
