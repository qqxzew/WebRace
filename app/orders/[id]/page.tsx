import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import OrderDetailClient from './OrderDetailClient'
import type { Profile, OrderWithItems } from '@/types'

export const revalidate = 0

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const [{ data: profile }, { data: order }] = await Promise.all([
    admin.from('profiles').select('*').eq('id', user.id).single(),
    admin
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single(),
  ])

  if (!order) notFound()

  return (
    <div className="min-h-screen bg-[#fffef7]">
      <Navbar profile={profile as Profile} />
      <OrderDetailClient order={order as unknown as OrderWithItems} />
    </div>
  )
}
