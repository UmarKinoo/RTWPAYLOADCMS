/**
 * MyFatoorah v2 API client for payment gateway integration.
 * Docs: https://myfatoorah.readme.io/docs/overview
 * Test API: https://apitest.myfatoorah.com | Live: https://api.myfatoorah.com
 */

const getBaseUrl = () =>
  process.env.MYFATOORAH_API_URL || 'https://apitest.myfatoorah.com'
const getToken = () => process.env.MYFATOORAH_TOKEN || ''

export interface SendPaymentRequest {
  NotificationOption?: 'EML' | 'SMS' | 'LNK' | 'ALL'
  CustomerName: string
  CustomerEmail: string
  CustomerMobile?: string
  MobileCountryCode?: string
  InvoiceValue: number
  DisplayCurrencyIso: string
  CallBackUrl: string
  ErrorUrl: string
  Language?: string
  CustomerReference?: string
  UserDefinedField?: string
  InvoiceItems: Array<{ ItemName: string; Quantity: number; UnitPrice: number }>
}

export interface SendPaymentResponse {
  IsSuccess: boolean
  Message?: string
  ValidationErrors?: Array<{ Name: string; Error: string }>
  Data?: {
    InvoiceId: number
    InvoiceURL: string
    UserDefinedField?: string
    CustomerReference?: string
  }
}

export async function sendPayment(
  payload: SendPaymentRequest,
): Promise<SendPaymentResponse> {
  const rawToken = getToken()
  if (!rawToken) {
    throw new Error('MYFATOORAH_TOKEN is not set')
  }
  const token = rawToken.trim()
  const baseUrl = getBaseUrl().replace(/\/$/, '')
  const url = `${baseUrl}/v2/SendPayment`
  const body = {
    NotificationOption: 'LNK',
    ...payload,
  }
  // Log full payload we send (no token) so runtime log shows exactly what MyFatoorah receives
  console.error('[MyFatoorah SendPayment] request body', JSON.stringify(body, null, 2))
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const rawText = await res.text()
  let data: SendPaymentResponse
  try {
    data = JSON.parse(rawText) as SendPaymentResponse
  } catch {
    console.error('[MyFatoorah SendPayment] non-JSON response', res.status, rawText?.slice(0, 500))
    throw new Error(`MyFatoorah returned invalid response: ${res.status}`)
  }
  if (!res.ok) {
    const validationMsg =
      data.ValidationErrors?.map((e) => `${e.Name}: ${e.Error}`).join('; ') || ''
    const message = [data.Message, validationMsg].filter(Boolean).join(' ') || `MyFatoorah SendPayment failed: ${res.status}`
    console.error('[MyFatoorah SendPayment]', res.status, { Message: data.Message, ValidationErrors: data.ValidationErrors, fullBody: data })
    if (res.status === 500) {
      console.error('[MyFatoorah SendPayment] 500 tip: use MYFATOORAH_API_URL=https://api.myfatoorah.com for live token; whitelist CallBackUrl/ErrorUrl in MyFatoorah dashboard')
    }
    throw new Error(message)
  }
  if (!data.IsSuccess && data.ValidationErrors?.length) {
    const validationMsg = data.ValidationErrors.map((e) => `${e.Name}: ${e.Error}`).join('; ')
    console.error('[MyFatoorah SendPayment] IsSuccess=false', { Message: data.Message, ValidationErrors: data.ValidationErrors })
    throw new Error(data.Message ? `${data.Message} ${validationMsg}` : validationMsg)
  }
  if (!data.IsSuccess) {
    console.error('[MyFatoorah SendPayment] IsSuccess=false, no ValidationErrors', { Message: data.Message, data })
    throw new Error(data.Message || 'MyFatoorah SendPayment failed.')
  }
  return data
}

export interface GetPaymentStatusRequest {
  KeyType: 'PaymentId' | 'InvoiceId' | 'CustomerReference'
  Key: string
}

export interface GetPaymentStatusResponse {
  IsSuccess: boolean
  Message?: string
  ValidationErrors?: Array<{ Name: string; Error: string }> | null
  Data?: {
    InvoiceId: number
    InvoiceStatus: string
    CustomerReference?: string
    UserDefinedField?: string
    InvoiceTransactions?: Array<{
      TransactionStatus: string
      PaymentGateway: string
    }>
  }
}

export async function getPaymentStatus(
  params: GetPaymentStatusRequest,
): Promise<GetPaymentStatusResponse> {
  const rawToken = getToken()
  if (!rawToken) {
    throw new Error('MYFATOORAH_TOKEN is not set')
  }
  const token = rawToken.trim()
  const url = `${getBaseUrl().replace(/\/$/, '')}/v2/GetPaymentStatus`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(params),
  })
  const data = (await res.json()) as GetPaymentStatusResponse
  if (!res.ok) {
    const validationMsg =
      data.ValidationErrors?.map((e) => `${e.Name}: ${e.Error}`).join('; ') || ''
    const message = [data.Message, validationMsg].filter(Boolean).join(' ') || `MyFatoorah GetPaymentStatus failed: ${res.status}`
    throw new Error(message)
  }
  return data
}
