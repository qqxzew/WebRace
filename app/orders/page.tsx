import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import OrdersRealtimeRefresher from './OrdersRealtimeRefresher'
import { formatPrice, formatDateTime, statusLabel, getPickupCode } from '@/lib/utils'
import { ArrowRight, Package } from 'lucide-react'
import type { Profile, OrderWithItems } from '@/types'

export const revalidate = 0

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const [{ data: profile }, { data: orders }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const statusClass: Record<string, string> = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    preparing: 'status-preparing',
    ready: 'status-ready',
    picked_up: 'status-picked_up',
    cancelled: 'status-cancelled',
  }

  return (
    <div className="min-h-screen bg-[#fffef7]">
      <Navbar profile={profile as Profile} />
      <OrdersRealtimeRefresher userId={user.id} />

        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 pb-28 sm:pb-10">
        <h1 className="font-display text-3xl font-bold text-warm-900 mb-8">Moje objednávky</h1>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-warm-50 rounded-4xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-warm-300" />
            </div>
            <p className="font-display font-bold text-warm-700 text-xl">Žádné objednávky</p>
            <p className="text-warm-400 mt-2 mb-6">Zatím jsi nic neobjednal/a</p>
            <Link href="/" className="btn-primary inline-flex items-center gap-2">
              Objednat <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(orders as unknown as OrderWithItems[]).map((order, i) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-3xl border border-warm-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 p-5 opacity-0 animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {statusLabel(order.status)}
                      </span>
                      <span className="font-mono text-xs font-bold bg-peach-100 text-peach-600 px-2 py-0.5 rounded-lg tracking-widest">
                        {(order as unknown as { pickup_code?: string }).pickup_code || getPickupCode(order.id)}
                      </span>
                      <span className="text-warm-400 text-xs">{formatDateTime(order.created_at)}</span>
                    </div>
                    <p className="text-warm-600 text-sm">
                      {order.order_items?.map((i: { products: { name: string } }) => i.products?.name).join(', ')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-warm-900">{formatPrice(order.total_amount)}</p>
                    <ArrowRight className="w-4 h-4 text-warm-300 mt-1 ml-auto" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
