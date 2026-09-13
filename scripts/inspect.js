const fs = require('fs')
const path = require('path')

// Load .env.local variables manually
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8')
  envConfig.split('\n').forEach(line => {
    const parts = line.split('=')
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '')
      if (key && !key.startsWith('#')) {
        process.env[key] = value
      }
    }
  })
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase environment variables in .env.local')
  process.exit(1)
}

const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(url, key)

async function inspect() {
  console.log('--- INSPECTING SUPABASE PROPERTIES TABLE ---')
  const { data, error } = await supabase.from('properties').select('*')
  
  if (error) {
    console.error('Supabase Query Error:', error)
  } else {
    console.log(`Total Rows Found: ${data.length}`)
    console.log('Table Contents:')
    console.log(JSON.stringify(data, null, 2))
  }
}

inspect()
