import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendEmail, welcomeEmailTemplate, employerWelcomeEmailTemplate } from '@/lib/email'
import type { Employer } from '@/payload-types'
import { defaultLocale } from '@/i18n/config'
import { getServerSideURL } from '@/utilities/getURL'

function loginRedirectUrl(
  type: string,
  params: { success?: string; error?: string; collection?: string },
): string {
  const base = `${getServerSideURL()}/${defaultLocale}/login`
  const search = new URLSearchParams()
  if (params.success) search.set('success', params.success)
  if (params.error) search.set('error', params.error)
  if (params.collection) search.set('collection', params.collection)
  if (type === 'employer') search.set('collection', 'employers')
  const qs = search.toString()
  return qs ? `${base}?${qs}` : base
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const type = searchParams.get('type') || 'candidate' // 'candidate' or 'employer'

  if (!token || !email) {
    return NextResponse.redirect(loginRedirectUrl(type, { error: 'invalid-verification-link' }))
  }

  try {
    const payload = await getPayload({ config: await configPromise })

    // Determine collection based on type
    const collection = type === 'employer' ? 'employers' : type === 'candidate' ? 'candidates' : 'users'

    // Find user/employer with matching email and token
    const results = await payload.find({
      collection,
      where: {
        and: [
          { email: { equals: email } },
          { emailVerificationToken: { equals: token } },
          { emailVerificationExpires: { greater_than: new Date().toISOString() } },
        ],
      },
    })

    if (results.docs.length === 0) {
      return NextResponse.redirect(loginRedirectUrl(type, { error: 'verification-link-expired' }))
    }

    const user = results.docs[0]

    // Update to mark email as verified
    await payload.update({
      collection,
      id: user.id,
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    })

    // Send welcome email (employer-specific or generic)
    if (type === 'employer' && 'companyName' in user && 'responsiblePerson' in user) {
      const employer = user as Employer
      await sendEmail({
        to: email,
        subject: 'Welcome to Ready to Work!',
        html: employerWelcomeEmailTemplate(
          employer.companyName,
          employer.responsiblePerson
        ),
      })
    } else {
      const userType = type === 'employer' ? 'employer' : 'candidate'
      await sendEmail({
        to: email,
        subject: 'Welcome! Your email has been verified',
        html: welcomeEmailTemplate(email, userType),
      })
    }

    return NextResponse.redirect(loginRedirectUrl(type, { success: 'email-verified' }))
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(loginRedirectUrl(type, { error: 'verification-failed' }))
  }
}