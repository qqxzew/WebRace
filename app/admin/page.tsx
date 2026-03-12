import { createClient as createAdminClient } from '@supabase/supabase-js'
import { formatPrice } from '@/lib/utils'
import { ShoppingBag, TrendingUp, Users, Clock } from 'lucide-react'

export const revalidate = 0

export default async function AdminDashboard() {
  // Use service role to bypass RLS recursion issues
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { data: todayOrders },
    { data: allOrders },
    { data: pendingOrders },
    { data: students },
  ] = await Promise.all([
    adminSupabase.from('orders').select('total_amount').gte('created_at', today.toISOString()),
    adminSupabase.from('orders').select('total_amount, status'),
    adminSupabase.from('orders').select('id').in('status', ['pending', 'confirmed', 'preparing']),
    adminSupabase.from('profiles').select('id').eq('role', 'student'),
  ])

  const todayRevenue = (todayOrders ?? []).reduce((s, o) => s + Number(o.total_amount), 0)
  const totalRevenue = (allOrders ?? []).reduce((s, o) => s + Number(o.total_amount), 0)

  const stats = [
    {
      label: 'Tržby dnes',
      value: formatPrice(todayRevenue),
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50',
      subtext: `${todayOrders?.length ?? 0} objednávek`,
    },
    {
      label: 'Celkové tržby',
      value: formatPrice(totalRevenue),
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
      subtext: `${allOrders?.length ?? 0} celkem`,
    },
    {
      label: 'Aktivní objednávky',
      value: String(pendingOrders?.length ?? 0),
      icon: Clock,
      color: 'text-orange-600 bg-orange-50',
      subtext: 'čekají na zpracování',
    },
    {
      label: 'Studenti',
      value: String(students?.length ?? 0),
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
      subtext: 'registrovaných',
    },
  ]

  // Recent orders
  const { data: recentOrders } = await adminSupabase
    .from('orders')
    .select('*, profiles(full_name, class), order_items(quantity, products(name))')
    .order('created_at', { ascending: false })
    .limit(10)

  const statusClass: Record<string, string> = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    preparing: 'status-preparing',
    ready: 'status-ready',
    picked_up: 'status-picked_up',
    cancelled: 'status-cancelled',
  }
  const statusLabel: Record<string, string> = {
    pending: 'Čeká',
    confirmed: 'Potvrzeno',
    preparing: 'Připravuje se',
    ready: 'Připraveno',
    picked_up: 'Vyzvednuto',
    cancelled: 'Zrušeno',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-warm-900">Dashboard</h1>
        <p className="text-warm-500 mt-1">
          {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="bg-white rounded-3xl border border-warm-100 shadow-card p-5 opacity-0 animate-fade-up"
            style={{ animationDelay: `${i * 0.07}s`, animationFillMode: 'forwards' }}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="font-display font-bold text-warm-900 text-2xl">{stat.value}</p>
            <p className="text-warm-700 font-semibold text-sm mt-0.5">{stat.label}</p>
            <p className="text-warm-400 text-xs mt-0.5">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-3xl border border-warm-100 shadow-card">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-warm-100">
          <ShoppingBag className="w-5 h-5 text-peach-500" />
          <h2 className="font-display font-bold text-warm-900">Nedávné objednávky</h2>
        </div>
        <div className="divide-y divide-warm-50">
          {!recentOrders || recentOrders.length === 0 ? (
            <p className="text-warm-400 text-sm text-center py-8">Žádné objednávky</p>
          ) : (
            recentOrders.map((order: Record<string, unknown>) => {
              const profile = order.profiles as { full_name: string; class: string | null } | null
              const items = order.order_items as { quantity: number; products: { name: string } | null }[]
              return (
                <div key={order.id as string} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-warm-900 text-sm truncate">
                      {profile?.full_name ?? 'Neznámý'}
                      {profile?.class && <span className="text-warm-400 ml-1">({profile.class})</span>}
                    </p>
                    <p className="text-warm-400 text-xs truncate">
                      {items?.map(i => `${i.products?.name ?? '?'} ×${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusClass[order.status as string]}`}>
                    {statusLabel[order.status as string]}
                  </span>
                  <p className="font-bold text-warm-800 text-sm flex-shrink-0">
                    {formatPrice(Number(order.total_amount))}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
