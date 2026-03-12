'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OrdersRealtimeRefresher({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('orders-list-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        () => { router.refresh() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, router])

  return null
}
