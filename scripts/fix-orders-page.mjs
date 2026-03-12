import { readFileSync, writeFileSync } from 'fs'

const path = 'app/admin/orders/page.tsx'
let content = readFileSync(path, 'utf8')

content = content
  .replace(
    /const FILTERS[^=]*=\s*\[[^\]]*\]/s,
    `const TABS = [
  { value: 'active', label: 'Aktivní' },
  { value: 'picked_up', label: 'Vyzvednuto' },
]`
  )
  .replace(
    `const [filter, setFilter] = useState('all')`,
    `const [tab, setTab] = useState('active')`
  )
  .replace(
    /const load = async \(\) => \{\s*const res = await fetch\(`\/api\/admin\/orders\?status=\$\{filter\}`\)/,
    `const load = async () => {
    setLoading(true)
    const res = await fetch(\`/api/admin/orders?status=\${tab === 'active' ? 'active' : 'picked_up'}\`)`
  )
  .replace(
    `useEffect(() => { load() }, [filter])`,
    `useEffect(() => { load() }, [tab])`
  )

writeFileSync(path, content, 'utf8')
console.log('Done - checking result:')
const lines = content.split('\n').slice(18, 50)
console.log(lines.join('\n'))
