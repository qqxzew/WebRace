import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, ClipboardList, Users, BarChart3, UtensilsCrossed, ScanLine } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/scan', label: 'Výdejna', icon: ScanLine },
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produkty', icon: Package },
  { href: '/admin/orders', label: 'Objednávky', icon: ClipboardList },
  { href: '/admin/students', label: 'Studenti', icon: Users },
  { href: '/admin/analytics', label: 'Analýzy', icon: BarChart3 },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service role to bypass broken RLS policies
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-[#fffef7] flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-warm-100 shadow-sm flex flex-col fixed h-full z-30 hidden lg:flex">
        <div className="p-5 border-b border-warm-100">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-peach-500 rounded-xl flex items-center justify-center shadow-warm">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-warm-900 text-sm">Jídelna Plus</p>
              <p className="text-warm-400 text-xs">Admin panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-warm-600 hover:bg-peach-50 hover:text-peach-600 font-medium text-sm transition-colors"
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-warm-100">
          <p className="text-warm-400 text-xs">Přihlášen jako admin</p>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-warm-100 px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-warm-600 hover:bg-peach-50 hover:text-peach-600 font-medium text-xs whitespace-nowrap transition-colors"
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-0 lg:pt-0">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
