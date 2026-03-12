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

function randomBetween(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function seed() {
  // Fetch all students
  const { data: students, error: sErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')

  if (sErr || !students?.length) { console.error('Chyba při načítání studentů:', sErr); process.exit(1) }

  // Fetch all products
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, price, preparation_time_min')

  if (pErr || !products?.length) { console.error('Chyba při načítání produktů:', pErr); process.exit(1) }

  console.log(`Nalezeno ${students.length} studentů a ${products.length} produktů\n`)

  const statuses = ['picked_up', 'picked_up', 'picked_up', 'ready', 'preparing', 'confirmed', 'cancelled']
  const paymentMethods = ['school_credit', 'school_credit', 'card']

  let totalOrders = 0

  // Generate orders for the past 10 days
  for (let daysAgo = 10; daysAgo >= 0; daysAgo--) {
    const day = new Date()
    day.setDate(day.getDate() - daysAgo)

    // Skip weekends
    if (day.getDay() === 0 || day.getDay() === 6) continue

    const ordersThisDay = randomBetween(4, 12)

    for (let o = 0; o < ordersThisDay; o++) {
      const student = randomItem(students)

      // Pick 1-3 random products
      const shuffled = [...products].sort(() => Math.random() - 0.5)
      const picked = shuffled.slice(0, randomBetween(1, 3))

      const items = picked.map(p => ({
        product: p,
        quantity: randomBetween(1, 2),
      }))

      const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
      const maxPrep = Math.max(...items.map(i => i.product.preparation_time_min ?? 5))

      // Random hour during school break times: 9:30, 11:15, 13:00
      const breakHours = [9, 11, 13]
      const breakMins = [30, 15, 0]
      const breakIdx = randomBetween(0, 2)
      const orderDate = new Date(day)
      orderDate.setHours(breakHours[breakIdx], breakMins[breakIdx] + randomBetween(0, 10), 0, 0)

      const estimatedReady = new Date(orderDate.getTime() + maxPrep * 60000)

      // Older orders are mostly picked_up, recent ones can be any status
      const status = daysAgo === 0 ? randomItem(statuses) : 'picked_up'
      const paymentMethod = randomItem(paymentMethods)

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: student.id,
          status,
          payment_method: paymentMethod,
          total_amount: total,
          estimated_ready_at: estimatedReady.toISOString(),
          created_at: orderDate.toISOString(),
          updated_at: estimatedReady.toISOString(),
        })
        .select()
        .single()

      if (orderErr) { console.error('Chyba při vytváření objednávky:', orderErr.message); continue }

      const orderItems = items.map(i => ({
        order_id: order.id,
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price: i.product.price,
      }))

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
      if (itemsErr) { console.error('Chyba při vytváření položek:', itemsErr.message); continue }

      totalOrders++
    }

    const dateStr = day.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })
    console.log(`✓ ${dateStr.padEnd(14)} — ${ordersThisDay} objednávek`)
  }

  console.log(`\nCelkem vytvořeno ${totalOrders} objednávek za posledních 10 dní!`)
}

seed()
