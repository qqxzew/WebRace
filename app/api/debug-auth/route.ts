import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ status: 'not_logged_in', userError })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Try upsert
  const { data: upserted, error: upsertError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? 'Test',
      role: 'student',
      school_credit: 0,
    })
    .select('*')
    .single()

  return NextResponse.json({
    user_id: user.id,
    email: user.email,
    metadata: user.user_metadata,
    profile,
    profileError,
    upserted,
    upsertError,
  })
}
