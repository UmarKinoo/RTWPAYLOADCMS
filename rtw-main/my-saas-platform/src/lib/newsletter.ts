'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendEmail } from './email'

export interface SubscribeNewsletterResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Subscribe an email to the newsletter
 * @param email Email address to subscribe
 * @param source Optional source of the subscription (e.g., 'homepage')
 */
export async function subscribeNewsletter(
  email: string,
  source?: string
): Promise<SubscribeNewsletterResponse> {
  try {
    // Validate email
    if (!email || typeof email !== 'string') {
      return {
        success: false,
        error: 'Email is required',
      }
    }

    const trimmedEmail = email.trim().toLowerCase()
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return {
        success: false,
        error: 'Invalid email address',
      }
    }

    const payload = await getPayload({ config: await configPromise })

    // Check if email already exists
    const existing = await payload.find({
      collection: 'newsletter-subscriptions',
      where: {
        email: {
          equals: trimmedEmail,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      const subscription = existing.docs[0]
      
      // If already subscribed, send welcome email anyway and return success
      if (subscription.subscribed) {
        // Send welcome email even if already subscribed (in case they didn't receive it before)
        const emailResult = await sendEmail({
          to: trimmedEmail,
          subject: 'Welcome to Ready to Work Newsletter!',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #4644b8 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Ready to Work!</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px; margin-bottom: 20px;">Thank you for subscribing to our newsletter!</p>
                  <p style="font-size: 16px; margin-bottom: 20px;">You'll now receive updates about:</p>
                  <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
                    <li>New job opportunities</li>
                    <li>Platform updates and features</li>
                    <li>Tips for job seekers and employers</li>
                    <li>Industry news and insights</li>
                  </ul>
                  <p style="font-size: 16px; margin-top: 30px;">We're excited to have you on board!</p>
                  <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>The Ready to Work Team</p>
                </div>
              </body>
            </html>
          `,
        })
        
        if (!emailResult.success) {
          console.error('[Newsletter] Failed to send welcome email to existing subscriber:', emailResult.error)
        } else {
          console.log('[Newsletter] Welcome email sent to existing subscriber:', trimmedEmail)
        }
        
        return {
          success: true,
          message: 'You are already subscribed to our newsletter!',
        }
      }

      // If unsubscribed, resubscribe them
      await payload.update({
        collection: 'newsletter-subscriptions',
        id: subscription.id,
        data: {
          subscribed: true,
          subscribedAt: new Date().toISOString(),
          unsubscribedAt: null,
          source: source || subscription.source || 'homepage',
        },
      })

      // Send welcome email for resubscription
      const emailResult = await sendEmail({
        to: trimmedEmail,
        subject: 'Welcome back to Ready to Work Newsletter!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #4644b8 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome back to Ready to Work!</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Thank you for resubscribing to our newsletter!</p>
                <p style="font-size: 16px; margin-bottom: 20px;">You'll now receive updates about:</p>
                <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
                  <li>New job opportunities</li>
                  <li>Platform updates and features</li>
                  <li>Tips for job seekers and employers</li>
                  <li>Industry news and insights</li>
                </ul>
                <p style="font-size: 16px; margin-top: 30px;">We're excited to have you back!</p>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>The Ready to Work Team</p>
              </div>
            </body>
          </html>
        `,
      })

      if (!emailResult.success) {
        console.error('[Newsletter] Failed to send welcome email to resubscriber:', emailResult.error)
      } else {
        console.log('[Newsletter] Welcome email sent to resubscriber:', trimmedEmail)
      }

      return {
        success: true,
        message: 'Successfully resubscribed to our newsletter!',
      }
    }

    // Create new subscription
    await payload.create({
      collection: 'newsletter-subscriptions',
      data: {
        email: trimmedEmail,
        subscribed: true,
        subscribedAt: new Date().toISOString(),
        source: source || 'homepage',
      },
    })

    // Send welcome email
    const emailResult = await sendEmail({
      to: trimmedEmail,
      subject: 'Welcome to Ready to Work Newsletter!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4644b8 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Ready to Work!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Thank you for subscribing to our newsletter!</p>
              <p style="font-size: 16px; margin-bottom: 20px;">You'll now receive updates about:</p>
              <ul style="font-size: 16px; margin-bottom: 20px; padding-left: 20px;">
                <li>New job opportunities</li>
                <li>Platform updates and features</li>
                <li>Tips for job seekers and employers</li>
                <li>Industry news and insights</li>
              </ul>
              <p style="font-size: 16px; margin-top: 30px;">We're excited to have you on board!</p>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>The Ready to Work Team</p>
            </div>
          </body>
        </html>
      `,
    })

    if (!emailResult.success) {
      console.error('[Newsletter] Failed to send welcome email:', emailResult.error)
      // Still return success for subscription, but log the email error
    } else {
      console.log('[Newsletter] Welcome email sent successfully to:', trimmedEmail)
    }

    return {
      success: true,
      message: 'Successfully subscribed to our newsletter!',
    }
  } catch (error: any) {
    console.error('Newsletter subscription error:', error)
    return {
      success: false,
      error: error?.message || 'Failed to subscribe. Please try again later.',
    }
  }
}
