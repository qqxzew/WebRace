import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Parse .env.local
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

const students = [
  { name: 'Jan Novák',         email: 'jan.novak@student.skola.cz',         class: '3.A', credit: 150 },
  { name: 'Petra Svobodová',   email: 'petra.svobodova@student.skola.cz',   class: '2.B', credit: 200 },
  { name: 'Tomáš Dvořák',      email: 'tomas.dvorak@student.skola.cz',      class: '4.A', credit: 80  },
  { name: 'Lucie Horáčková',   email: 'lucie.horackova@student.skola.cz',   class: '1.A', credit: 320 },
  { name: 'Martin Procházka',  email: 'martin.prochazka@student.skola.cz',  class: '3.B', credit: 50  },
  { name: 'Tereza Nováková',   email: 'tereza.novakova@student.skola.cz',   class: '2.A', credit: 450 },
  { name: 'Jakub Krejčí',      email: 'jakub.krejci@student.skola.cz',      class: '1.B', credit: 175 },
  { name: 'Karolína Blažková', email: 'karolina.blazkova@student.skola.cz', class: '4.B', credit: 90  },
  { name: 'Ondřej Marek',      email: 'ondrej.marek@student.skola.cz',      class: '3.A', credit: 265 },
  { name: 'Adéla Pokorná',     email: 'adela.pokorna@student.skola.cz',     class: '2.B', credit: 380 },
]

async function seed() {
  console.log('Přidávám studenty...\n')
  for (const s of students) {
    const { data, error: authErr } = await supabase.auth.admin.createUser({
      email: s.email,
      password: 'Heslo123!',
      email_confirm: true,
    })
    if (authErr) {
      console.error(`✗ ${s.name}: ${authErr.message}`)
      continue
    }
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: s.name,
      role: 'student',
      school_credit: s.credit,
      class: s.class,
    })
    if (profileErr) {
      console.error(`✗ Profil ${s.name}: ${profileErr.message}`)
    } else {
      console.log(`✓ ${s.name.padEnd(22)} ${s.class}  ${String(s.credit).padStart(4)} Kč  ${s.email}`)
    }
  }
  console.log('\nHotovo! Heslo pro všechny studenty: Heslo123!')
}

seed()
