import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { items, paymentMethod, cartTotal } = await request.json()

  // Deduct credit if paying with school_credit
  if (paymentMethod === 'school_credit') {
    const { data: profile } = await admin.from('profiles').select('school_credit').eq('id', user.id).single()
    if (!profile || Number(profile.school_credit) < cartTotal) {
      return NextResponse.json({ error: 'Nedostatek kreditu' }, { status: 400 })
    }
    const { error: creditError } = await admin
      .from('profiles')
      .update({ school_credit: Number(profile.school_credit) - cartTotal })
      .eq('id', user.id)
    if (creditError) return NextResponse.json({ error: 'Platba selhala' }, { status: 500 })
  }

  // Create order
  const maxPrepTime = Math.max(...items.map((i: { product: { preparation_time_min: number } }) => i.product.preparation_time_min))
  const estimatedReady = new Date(Date.now() + maxPrepTime * 60000)

  // Generate 4-digit pickup code
  const pickupCode = String(Math.floor(1000 + Math.random() * 9000))

  // Try inserting with pickup_code; if column doesn't exist yet, fall back without it
  let order: { id: string } | null = null
  let orderError: { message?: string; code?: string } | null = null

  const withCode = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      payment_method: paymentMethod,
      total_amount: cartTotal,
      pickup_code: pickupCode,
      estimated_ready_at: estimatedReady.toISOString(),
    })
    .select()
    .single()

  if (withCode.error && (withCode.error.code === '42703' || withCode.error.message?.includes('pickup_code'))) {
    // Column doesn't exist yet — insert without it
    const withoutCode = await admin
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        payment_method: paymentMethod,
        total_amount: cartTotal,
        estimated_ready_at: estimatedReady.toISOString(),
      })
      .select()
      .single()
    order = withoutCode.data
    orderError = withoutCode.error
  } else {
    order = withCode.data
    orderError = withCode.error
  }

  if (orderError || !order) return NextResponse.json({ error: 'Vytvoření objednávky selhalo' }, { status: 500 })

  // Create order items
  const orderItems = items.map((item: { product: { id: string; price: number }; quantity: number }) => ({
    order_id: order.id,
    product_id: item.product.id,
    quantity: item.quantity,
    unit_price: item.product.price,
  }))

  const { error: itemsError } = await admin.from('order_items').insert(orderItems)
  if (itemsError) return NextResponse.json({ error: 'Uložení položek selhalo' }, { status: 500 })

  return NextResponse.json({ order_id: order.id })
}
