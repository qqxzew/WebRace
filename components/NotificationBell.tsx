'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Notification } from '@/types'
import { formatDistanceToNow } from '@/lib/utils'

interface NotificationBellProps {
  userId: string
}

/** Request Notification permission and return whether it was granted */
async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/** Show a native browser push notification (uses SW if available, falls back to new Notification) */
async function showPushNotification(title: string, body: string, url = '/orders') {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null)
    if (reg) {
      await reg.showNotification(title, {
        body,
        tag: 'jidalnaplus-order',
        data: { url },
        requireInteraction: true,
      })
      return
    }
  }
  // Fallback — plain Notification API
  new Notification(title, { body })
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Register service worker + track permission state
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) { setPushPermission('unsupported'); return }
    setPushPermission(Notification.permission)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const enablePush = async () => {
    const granted = await requestNotificationPermission()
    setPushPermission(granted ? 'granted' : 'denied')
  }

  useEffect(() => {
    // Track known IDs to detect new notifications during polling
    const knownIds = new Set<string>()

    const fetchNotifications = async (isInitial = false) => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (!data) return

      if (isInitial) {
        // Seed known IDs without firing anything
        data.forEach(n => knownIds.add(n.id))
        setNotifications(data)
        return
      }

      // Find genuinely new notifications
      const newOnes = data.filter(n => !knownIds.has(n.id))
      if (newOnes.length > 0) {
        newOnes.forEach(n => knownIds.add(n.id))
        setNotifications(data)

        for (const notif of newOnes) {
          // Native OS push banner
          await showPushNotification('Jídelna Plus 🍽️', notif.message, '/orders')

          // In-app toast
          toast.success(notif.message, { duration: 8000, icon: '🍽️' })

          // Vibrate on mobile
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
        }
      }
    }

    fetchNotifications(true)

    // Poll every 3s — works even without Realtime publication
    const interval = setInterval(() => fetchNotifications(false), 3_000)

    // Also subscribe via Realtime as bonus (instant if it works)
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        async (payload) => {
          const newNotif = payload.new as Notification
          if (knownIds.has(newNotif.id)) return // already handled by polling
          knownIds.add(newNotif.id)
          setNotifications(prev => [newNotif, ...prev])
          await showPushNotification('Jídelna Plus 🍽️', newNotif.message, '/orders')
          toast.success(newNotif.message, { duration: 8000, icon: '🍽️' })
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl hover:bg-warm-100 text-warm-700 transition-colors"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-peach-500' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-peach-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse-soft">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-card-hover border border-warm-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-warm-100">
            <h3 className="font-display font-bold text-warm-900">Oznámení</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-peach-500 hover:text-peach-600 font-semibold"
                >
                  Označit vše
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-warm-400 hover:text-warm-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Push permission banner */}
          {pushPermission === 'default' && (
            <div className="mx-3 mt-3 mb-1 bg-peach-50 border border-peach-200 rounded-2xl p-3 flex items-center gap-3">
              <span className="text-xl flex-shrink-0">🔔</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-warm-800">Zapni push notifikace</p>
                <p className="text-[11px] text-warm-500">Dostaneš upozornění, když bude objednávka hotová</p>
              </div>
              <button
                onClick={enablePush}
                className="flex-shrink-0 px-3 py-1.5 bg-peach-500 text-white text-xs font-bold rounded-xl hover:bg-peach-600 transition-colors"
              >
                Zapnout
              </button>
            </div>
          )}
          {pushPermission === 'denied' && (
            <div className="mx-3 mt-3 mb-1 bg-warm-50 border border-warm-200 rounded-2xl p-3">
              <p className="text-xs text-warm-500 text-center">Push notifikace jsou zakázány v nastavení prohlížeče</p>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="w-8 h-8 text-warm-300 mx-auto mb-2" />
                <p className="text-warm-400 text-sm">Žádná oznámení</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-warm-50 last:border-0 ${
                    !notif.is_read ? 'bg-peach-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      !notif.is_read ? 'bg-peach-500' : 'bg-transparent'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-warm-800">{notif.message}</p>
                      <p className="text-xs text-warm-400 mt-0.5">
                        {formatDistanceToNow(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
