import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') return null
  return user
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const admin = getAdminClient()
  let query = admin
    .from('orders')
    .select('*, profiles(full_name, class), order_items(quantity, products(name, image_url))')
    .order('created_at', { ascending: false })

  if (status === 'active') {
    query = query.not('status', 'in', '("picked_up","cancelled")')
  } else if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id, status } = await request.json()
  const admin = getAdminClient()

  // Get order to find user_id
  const { data: order } = await admin.from('orders').select('user_id').eq('id', id).single()

  const { error } = await admin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If status is "preparing" (= Hotovo in simplified flow), send notification
  if (status === 'preparing' && order) {
    const shortId = id.slice(-8).toUpperCase()
    await admin.from('notifications').insert({
      user_id: order.user_id,
      order_id: id,
      message: `🎉 Tvoje objednávka #${shortId} je hotová! Přijď si ji vyzvednout.`,
      is_read: false,
    })
  }

  return NextResponse.json({ success: true })
}
