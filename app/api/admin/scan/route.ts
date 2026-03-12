import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getPickupCode } from '@/lib/utils'

export async function GET(request: Request) {
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

  const code = new URL(request.url).searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  // Fetch all active orders (not picked_up / cancelled) with items
  const { data: orders } = await admin
    .from('orders')
    .select('*, order_items(*, products(*)), profiles(full_name, class)')
    .not('status', 'in', '("picked_up","cancelled")')
    .order('created_at', { ascending: false })

  if (!orders) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  // Find order whose pickup_code (stored or derived) matches
  const match = orders.find(o => {
    const stored = (o.pickup_code as string | null)?.toUpperCase()
    const derived = getPickupCode(o.id)
    return stored === code || derived === code
  })

  if (!match) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json(match)
}
