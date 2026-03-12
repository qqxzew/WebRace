import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=')
  if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
})

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY'],
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

async function seed() {
  const { data: students, error: sErr } = await supabase
    .from('profiles').select('id').eq('role', 'student')
  if (sErr || !students?.length) { console.error('Chyba studenti:', sErr); process.exit(1) }

  const { data: products, error: pErr } = await supabase
    .from('products').select('id, price, preparation_time_min')
  if (pErr || !products?.length) { console.error('Chyba produkty:', pErr); process.exit(1) }

  console.log(`${students.length} studentů, ${products.length} produktů\n`)

  const paymentMethods = ['school_credit', 'school_credit', 'card']
  const breakHours  = [9, 11, 13]
  const breakMins   = [30, 15, 0]

  let total = 0

  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const day = new Date()
    day.setDate(day.getDate() - daysAgo)
    if (day.getDay() === 0 || day.getDay() === 6) continue // skip weekends

    for (let o = 0; o < 5; o++) {
      const student = pick(students)
      const shuffled = [...products].sort(() => Math.random() - 0.5)
      const picked = shuffled.slice(0, rnd(1, 3))
      const items = picked.map(p => ({ product: p, quantity: rnd(1, 2) }))
      const totalAmount = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
      const maxPrep = Math.max(...items.map(i => i.product.preparation_time_min ?? 5))

      const bi = rnd(0, 2)
      const orderDate = new Date(day)
      orderDate.setHours(breakHours[bi], breakMins[bi] + rnd(0, 10), rnd(0, 59), 0)
      const estimatedReady = new Date(orderDate.getTime() + maxPrep * 60000)

      // Today's orders can have any status; older ones are picked_up
      const status = daysAgo === 0 ? pick(['pending','confirmed','preparing','ready','picked_up']) : 'picked_up'

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: student.id,
          status,
          payment_method: pick(paymentMethods),
          total_amount: totalAmount,
          estimated_ready_at: estimatedReady.toISOString(),
          created_at: orderDate.toISOString(),
          updated_at: estimatedReady.toISOString(),
        })
        .select().single()

      if (orderErr) { console.error('Order error:', orderErr.message); continue }

      const { error: itemsErr } = await supabase.from('order_items').insert(
        items.map(i => ({
          order_id: order.id,
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.price,
        }))
      )
      if (itemsErr) { console.error('Items error:', itemsErr.message); continue }

      total++
    }

    const label = day.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })
    console.log(`✓ ${label.padEnd(14)} — 5 objednávek`)
  }

  console.log(`\nHotovo! Vytvořeno ${total} objednávek.`)
}

seed()
