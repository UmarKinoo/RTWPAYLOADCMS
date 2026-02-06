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
  const url = `${getBaseUrl().replace(/\/$/, '')}/v2/SendPayment`
  const body = {
    NotificationOption: 'LNK',
    ...payload,
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as SendPaymentResponse
  if (!res.ok) {
    const validationMsg =
      data.ValidationErrors?.map((e) => `${e.Name}: ${e.Error}`).join('; ') || ''
    const message = [data.Message, validationMsg].filter(Boolean).join(' ') || `MyFatoorah SendPayment failed: ${res.status}`
    throw new Error(message)
  }
  if (!data.IsSuccess && data.ValidationErrors?.length) {
    const validationMsg = data.ValidationErrors.map((e) => `${e.Name}: ${e.Error}`).join('; ')
    throw new Error(data.Message ? `${data.Message} ${validationMsg}` : validationMsg)
  }
  return data
}

export interface GetPaymentStatusRequest {
  KeyType: 'PaymentId' | 'InvoiceId'
  Key: string
}

export interface GetPaymentStatusResponse {
  IsSuccess: boolean
  Message?: string
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
  const token = getToken()
  if (!token) {
    throw new Error('MYFATOORAH_TOKEN is not set')
  }
  const url = `${getBaseUrl().replace(/\/$/, '')}/v2/getPaymentStatus`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  const data = (await res.json()) as GetPaymentStatusResponse
  if (!res.ok) {
    throw new Error(data.Message || `MyFatoorah getPaymentStatus failed: ${res.status}`)
  }
  return data
}
