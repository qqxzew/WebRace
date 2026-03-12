import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// One-time admin creation endpoint. Remove after first use.
// Usage: POST /api/admin-setup
// Body: { "email": "...", "password": "...", "full_name": "..." }

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey || serviceKey === 'ВСТАВЬ_СЮДА_SERVICE_ROLE_KEY') {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY не задан в .env.local' },
      { status: 500 }
    )
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let body: { email?: string; password?: string; full_name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Neplatné JSON tělo' }, { status: 400 })
  }

  const { email, password, full_name } = body

  if (!email || !password || !full_name) {
    return NextResponse.json(
      { error: 'Povinné: email, password, full_name' },
      { status: 400 }
    )
  }

  // Create user bypassing email validation
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation
    user_metadata: { full_name },
  })

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 })
  }

  // Set role to admin in profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userData.user.id,
      full_name,
      role: 'admin',
      school_credit: 0,
    })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    message: `Admin ${email} vytvořen! Nyní se přihlas na /login`,
    user_id: userData.user.id,
  })
}
