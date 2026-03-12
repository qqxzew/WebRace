'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, UtensilsCrossed, LogOut, User, LayoutDashboard, CreditCard, Home, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart'
import NotificationBell from './NotificationBell'
import type { Profile } from '@/types'
import { toast } from 'sonner'

interface NavbarProps {
  profile: Profile | null
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { itemCount, toggleCart, clearCart } = useCartStore()
  const count = itemCount()

  const handleLogout = async () => {
    clearCart()
    await supabase.auth.signOut()
    toast.success('Odhlášen/a')
    router.push('/login')
    router.refresh()
  }

  const isStudent = profile?.role === 'student'
  const isAdmin = profile?.role === 'admin'

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-warm-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-peach-500 rounded-2xl flex items-center justify-center shadow-warm group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="font-display font-bold text-warm-900 text-base sm:text-lg">
              Jídelna Plus
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {profile ? (
              <>
                {/* Credit balance — always visible on mobile, prominent */}
                <div className="flex items-center gap-1 sm:gap-1.5 bg-peach-50 text-peach-600 px-2.5 sm:px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-semibold border border-peach-100">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{profile.school_credit.toFixed(0)} Kč</span>
                </div>

                {/* Notifications */}
                <NotificationBell userId={profile.id} />

                {/* Cart button — desktop only; mobile uses bottom tab */}
                {isStudent && (
                  <button
                    onClick={toggleCart}
                    className="relative hidden sm:flex p-2.5 rounded-2xl hover:bg-warm-100 text-warm-700 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-peach-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </button>
                )}

                {/* Admin link */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-warm-100 hover:bg-warm-200 text-warm-700 text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:block">Admin</span>
                  </Link>
                )}

                {/* User chip — desktop only */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-warm-50 border border-warm-100">
                  <User className="w-4 h-4 text-warm-500" />
                  <span className="text-sm text-warm-700 font-medium max-w-[100px] truncate">
                    {profile.full_name.split(' ')[0]}
                  </span>
                </div>

                {/* Orders link — desktop only */}
                {isStudent && (
                  <Link
                    href="/orders"
                    className="hidden sm:flex items-center gap-1.5 text-sm text-warm-600 hover:text-warm-900 font-medium px-2 py-1.5 rounded-xl hover:bg-warm-100 transition-colors"
                  >
                    Objednávky
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2 sm:p-2.5 rounded-2xl hover:bg-red-50 text-warm-400 hover:text-red-500 transition-colors"
                  title="Odhlásit se"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost text-sm font-semibold py-2 px-3">
                  Přihlásit
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2 px-4">
                  Registrovat
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Bottom tab bar — mobile only, students only ── */}
      {isStudent && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-warm-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around h-16 px-2">
            {/* Home */}
            <Link href="/" className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-colors ${pathname === '/' ? 'text-peach-500' : 'text-warm-400 active:bg-warm-100'}`}>
              <Home className={`w-6 h-6 transition-transform ${pathname === '/' ? 'scale-110' : ''}`} strokeWidth={pathname === '/' ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold">Nabídka</span>
            </Link>

            {/* Cart — big center button */}
            <button
              onClick={toggleCart}
              className="relative flex flex-col items-center gap-0.5 -mt-5"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-warm transition-all active:scale-95 ${count > 0 ? 'bg-peach-500' : 'bg-warm-800'}`}>
                <ShoppingCart className="w-6 h-6 text-white" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-peach-600 text-xs font-bold rounded-full flex items-center justify-center border-2 border-peach-500">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-warm-500 mt-0.5">Košík</span>
            </button>

            {/* Orders */}
            <Link href="/orders" className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-colors ${pathname.startsWith('/orders') ? 'text-peach-500' : 'text-warm-400 active:bg-warm-100'}`}>
              <ClipboardList className={`w-6 h-6 transition-transform ${pathname.startsWith('/orders') ? 'scale-110' : ''}`} strokeWidth={pathname.startsWith('/orders') ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold">Objednávky</span>
            </Link>
          </div>
          {/* Safe area spacer for iPhone home indicator */}
          <div className="h-safe-bottom" style={{ height: 'env(safe-area-inset-bottom)' }} />
        </div>
      )}
    </>
  )
}
