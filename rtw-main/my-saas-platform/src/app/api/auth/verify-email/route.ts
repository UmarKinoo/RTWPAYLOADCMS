import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendEmail, welcomeEmailTemplate, employerWelcomeEmailTemplate } from '@/lib/email'
import type { Employer } from '@/payload-types'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const type = searchParams.get('type') || 'candidate' // 'candidate' or 'employer'

  if (!token || !email) {
    return NextResponse.redirect(new URL('/login?error=invalid-verification-link', request.url))
  }

  try {
    const payload = await getPayload({ config: await configPromise })

    // Determine collection based on type
    const collection = type === 'employer' ? 'employers' : 'users'

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
      return NextResponse.redirect(new URL('/login?error=verification-link-expired', request.url))
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
      await sendEmail({
        to: email,
        subject: 'Welcome! Your email has been verified',
        html: welcomeEmailTemplate(email, type as 'candidate' | 'employer'),
      })
    }

    // Redirect to appropriate login page with success message
    const redirectUrl = type === 'employer' 
      ? '/login?success=email-verified&collection=employers'
      : '/login?success=email-verified'
    
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/login?error=verification-failed', request.url))
  }
}