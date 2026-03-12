import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Client } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=')
  if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
})

// Extract project ref from URL
const url = new URL(env['NEXT_PUBLIC_SUPABASE_URL'])
const projectRef = url.hostname.split('.')[0]

// Supabase direct postgres connection (service role key = db password for postgres role)
const connectionString = `postgresql://postgres.${projectRef}:${env['SUPABASE_SERVICE_ROLE_KEY']}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

function generateCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // no I/O to avoid confusion
  const digits = '0123456789'
  const chars = [
    letters[Math.floor(Math.random() * letters.length)],
    letters[Math.floor(Math.random() * letters.length)],
    letters[Math.floor(Math.random() * letters.length)],
    digits[Math.floor(Math.random() * digits.length)],
    digits[Math.floor(Math.random() * digits.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ]
  // shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

  try {
    await client.connect()
    console.log('✓ Připojeno k databázi\n')

    // Add column
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code text`)
    console.log('✓ Kolumna pickup_code přidána\n')

    // Fetch orders without code
    const { rows: orders } = await client.query(
      `SELECT id FROM orders WHERE pickup_code IS NULL OR pickup_code = ''`
    )
    console.log(`Objednávky bez kódu: ${orders.length}`)

    // Update each with unique code
    const usedCodes = new Set()
    let updated = 0

    for (const order of orders) {
      let code
      do { code = generateCode() } while (usedCodes.has(code))
      usedCodes.add(code)

      await client.query(`UPDATE orders SET pickup_code = $1 WHERE id = $2`, [code, order.id])
      updated++
    }

    console.log(`✓ Přidány kódy k ${updated} objednávkám`)
    console.log('\nPříklady kódů: ' + [...usedCodes].slice(0, 5).join(', '))

  } catch (err) {
    console.error('\n✗ Chyba:', err.message)
    if (err.message.includes('password') || err.message.includes('auth')) {
      console.log('\nPřipojení selhalo. Spusť tento SQL ručně v Supabase dashboardu:')
      console.log('https://supabase.com/dashboard/project/' + projectRef + '/sql/new\n')
      console.log(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_code text;`)
      console.log(`UPDATE orders SET pickup_code = (`)
      console.log(`  SELECT string_agg(c, '') FROM (`)
      console.log(`    SELECT c FROM (`)
      console.log(`      SELECT chr(ascii('A') + floor(random()*25)::int) AS c`)
      console.log(`      UNION ALL SELECT chr(ascii('A') + floor(random()*25)::int)`)
      console.log(`      UNION ALL SELECT chr(ascii('A') + floor(random()*25)::int)`)
      console.log(`      UNION ALL SELECT floor(random()*10)::text`)
      console.log(`      UNION ALL SELECT floor(random()*10)::text`)
      console.log(`      UNION ALL SELECT floor(random()*10)::text`)
      console.log(`    ) chars ORDER BY random()`)
      console.log(`  ) shuffled`)
      console.log(`) WHERE pickup_code IS NULL;`)
    }
  } finally {
    await client.end()
  }
}

run()
