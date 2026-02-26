export const handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json' }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"POST only"}' }
  try {
    const { ANTHROPIC_API_KEY } = process.env
    if (!ANTHROPIC_API_KEY) return { statusCode: 500, headers, body: '{"error":"ANTHROPIC_API_KEY not set"}' }
    const body = JSON.parse(event.body)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: body.model || 'claude-sonnet-4-20250514', max_tokens: body.max_tokens || 1000, messages: body.messages }),
    })
    return { statusCode: 200, headers, body: JSON.stringify(await res.json()) }
  } catch (err) { return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) } }
}
