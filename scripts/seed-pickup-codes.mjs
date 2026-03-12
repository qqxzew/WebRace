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

async function seed() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, pickup_code')

  if (error) {
    console.error('Chyba:', error.message)
    if (error.message.includes('pickup_code') || error.code === '42703') {
      console.log('\n⚠️  Kolumna pickup_code neexistuje.')
      console.log('Nejprve spusť tento SQL v Supabase dashboardu:')
      console.log('https://supabase.com/dashboard/project/fnlmhjqqufvhwxvwnulu/sql/new\n')
      console.log('ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code text;')
      console.log("UPDATE orders SET pickup_code = LPAD(FLOOR(RANDOM() * 9000 + 1000)::text, 4, '0') WHERE pickup_code IS NULL;")
    }
    process.exit(1)
  }

  const without = orders.filter(o => !o.pickup_code)
  console.log(`Celkem objednávek: ${orders.length}, bez kódu: ${without.length}`)

  let updated = 0
  for (const order of without) {
    const code = String(Math.floor(1000 + Math.random() * 9000))
    const { error: upErr } = await supabase
      .from('orders')
      .update({ pickup_code: code })
      .eq('id', order.id)
    if (!upErr) updated++
  }

  console.log(`✓ Přidány kódy k ${updated} objednávkám`)
}

seed()
