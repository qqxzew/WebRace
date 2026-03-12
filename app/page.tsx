import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import CartSidebar from '@/components/CartSidebar'
import CatalogClient from './CatalogClient'
import type { Product, Profile } from '@/types'

// Force dynamic — page depends on logged-in user, must not be cached
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // getUser() verifies JWT with Supabase server — safe for server components
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile and products in parallel
  const [profileResult, productsResult] = await Promise.all([
    user
      ? supabase.from('profiles').select('*').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('category')
      .order('name'),
  ])

  let profile = profileResult.data as Profile | null

  // If user is logged in but profile doesn't exist yet (trigger not set up),
  // try to create it in DB
  if (user && !profile) {
    const { data: upserted } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Uživatel',
        role: 'student',
        school_credit: 0,
        class: user.user_metadata?.class ?? null,
      })
      .select('*')
      .single()
    profile = upserted as Profile | null
  }

  // Fallback: if DB upsert also failed, build a minimal profile from auth user
  // so the Navbar always shows the logged-in UI
  if (user && !profile) {
    profile = {
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Uživatel',
      role: 'student',
      school_credit: 0,
      class: user.user_metadata?.class ?? null,
      avatar_url: null,
      created_at: new Date().toISOString(),
    }
  }

  const products = productsResult.data

  return (
    <div className="min-h-screen bg-[#fffef7]">
      <Navbar profile={profile} />
      <CartSidebar />

      <main className="max-w-6xl mx-auto px-4 py-5 sm:py-8 pb-24 sm:pb-8">
        {/* Hero */}
        <div className="mb-6 sm:mb-10 animate-fade-up">
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-warm-900 leading-tight">
            Dobré jídlo,<br />
            <span className="text-peach-500">bez čekání. 🍕</span>
          </h1>
          <p className="text-warm-500 mt-2 sm:mt-3 text-base sm:text-lg max-w-xl">
            Objednej si svačinu online a dostaneš notifikaci, až bude hotová.
            Žádné fronty, žádný stres.
          </p>
        </div>

        <CatalogClient
          products={(products ?? []) as Product[]}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  )
}
