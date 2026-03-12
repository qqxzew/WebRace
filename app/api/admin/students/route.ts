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

export async function GET() {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { student_id, action, amount } = await request.json()
  if (!student_id || !action || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const admin = getAdminClient()

  // Get current balance
  const { data: profile } = await admin.from('profiles').select('school_credit').eq('id', student_id).single()
  if (!profile) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const currentCredit = Number(profile.school_credit)
  const newCredit = action === 'add'
    ? currentCredit + Number(amount)
    : currentCredit - Number(amount)

  if (newCredit < 0) return NextResponse.json({ error: 'Nedostatečný kredit' }, { status: 400 })

  const { error } = await admin
    .from('profiles')
    .update({ school_credit: newCredit })
    .eq('id', student_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, new_credit: newCredit })
}
