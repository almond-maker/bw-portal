export const handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers }
  try {
    const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: false, error: 'Google credentials not configured' }) }
    }
    const now = Math.floor(Date.now() / 1000)
    const claim = { iss: GOOGLE_SERVICE_ACCOUNT_EMAIL, scope: 'https://www.googleapis.com/auth/spreadsheets.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }
    const crypto = await import('crypto')
    const hdr = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
    const pl = Buffer.from(JSON.stringify(claim)).toString('base64url')
    const signable = `${hdr}.${pl}`
    const key = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    const sign = crypto.createSign('RSA-SHA256'); sign.update(signable)
    const jwt = `${signable}.${sign.sign(key, 'base64url')}`
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) return { statusCode: 200, headers, body: JSON.stringify({ success: false, error: 'Google auth failed' }) }
    const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/Sheet1!A2:I50`, { headers: { Authorization: `Bearer ${tokenData.access_token}` } })
    const rows = (await sheetRes.json()).values || []
    const clientMap = { 'dreambody': 'c1', 'figma': 'c2', 'geniesweb': 'c3', 'genies web': 'c3', 'genies': 'c4', 'hook': 'c5', 'jabali': 'c6', 'playful': 'c7', 'simz': 'c8', 'tea': 'c9', 'watched': 'c10', 'zora': 'c11' }
    const scopeRows = rows.map(row => { const n = (row[0]||'').trim().toLowerCase(); const cid = clientMap[n]; if (!cid) return null; return { client_id: cid, live_posts: parseInt(row[1])||0, scope_goal: parseInt(row[2])||0, progress: parseFloat(row[3])||0, videos_left: parseInt(row[4])||0, scope_start: (row[5]||'').trim(), scope_end: (row[6]||'').trim(), scope_notes: (row[7]||'').trim(), standup_notes: (row[8]||'').trim(), refreshed_at: new Date().toISOString() } }).filter(Boolean)
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      for (const row of scopeRows) {
        await fetch(`${SUPABASE_URL}/rest/v1/scope_data`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Prefer': 'return=minimal' }, body: JSON.stringify(row) })
      }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, count: scopeRows.length, data: scopeRows }) }
  } catch (err) { return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: err.message }) } }
}
