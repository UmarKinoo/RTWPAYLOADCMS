/**
 * Verify MyFatoorah LIVE token by calling InitiatePayment.
 * Uses MYFATOORAH_TOKEN and MYFATOORAH_API_URL from .env.
 *
 * Run: pnpm run verify:myfatoorah
 *
 * 401/403 → token wrong, not live, revoked/expired, or not enabled for that environment.
 * 200 + IsSuccess true → token is valid in live.
 * 500 → live account may not be fully activated or server error.
 */
import 'dotenv/config'

const baseUrl = (process.env.MYFATOORAH_API_URL || 'https://api.myfatoorah.com').replace(/\/$/, '')
const token = (process.env.MYFATOORAH_TOKEN || '').trim()

async function main() {
  if (!token) {
    console.error('MYFATOORAH_TOKEN is not set in .env')
    process.exit(1)
  }
  const url = `${baseUrl}/v2/InitiatePayment`
  const body = { InvoiceAmount: 450, CurrencyIso: 'SAR' }
  console.log('POST', url)
  console.log('Body:', JSON.stringify(body, null, 2))
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: { IsSuccess?: boolean; Message?: string; ValidationErrors?: Array<{ Name: string; Error: string }> }
  try {
    data = JSON.parse(text)
  } catch {
    console.log('Response (non-JSON):', text.slice(0, 500))
    data = {}
  }
  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(data, null, 2))
  if (res.status === 401 || res.status === 403) {
    console.log('\n→ Token is wrong, not "live", revoked/expired, or not enabled for this environment.')
    process.exit(1)
  }
  if (res.status === 200 && data.IsSuccess === true) {
    console.log('\n→ Token is valid in live. Proceed to debug SendPayment (e.g. callback whitelist).')
    process.exit(0)
  }
  if (res.status === 500) {
    console.log('\n→ Live account may not be fully activated, or MyFatoorah server error. Contact MyFatoorah support.')
    process.exit(1)
  }
  console.log('\n→ Unexpected response. Check token and API URL.')
  process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
