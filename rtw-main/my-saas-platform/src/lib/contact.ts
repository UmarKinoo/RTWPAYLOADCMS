'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { sendEmail } from './email'

export interface SubmitContactFormResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Submit contact form
 * @param formData Contact form data
 */
export async function submitContactForm(formData: {
  name: string
  email: string
  phone: string
  title: string
  message: string
}): Promise<SubmitContactFormResponse> {
  try {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.title || !formData.message) {
      return {
        success: false,
        error: 'All fields are required',
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      return {
        success: false,
        error: 'Invalid email address',
      }
    }

    const payload = await getPayload({ config: await configPromise })

    // Save submission to database
    await payload.create({
      collection: 'contact-submissions',
      data: {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        title: formData.title.trim(),
        message: formData.message.trim(),
        read: false,
      },
    })

    // Send email notification to admin
    const adminEmail = process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || 'noreply@readytowork.sa'
    
    const emailResult = await sendEmail({
      to: adminEmail,
      subject: `New Contact Form Submission from ${formData.name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4644b8 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">New Contact Form Submission</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #16252d; margin-top: 0; font-size: 20px;">Contact Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold; width: 120px;">Name:</td>
                    <td style="padding: 8px 0; color: #16252d;">${formData.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 0; color: #16252d;">
                      <a href="mailto:${formData.email}" style="color: #4644b8; text-decoration: none;">${formData.email}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
                    <td style="padding: 8px 0; color: #16252d;">
                      <a href="tel:${formData.phone}" style="color: #4644b8; text-decoration: none;">${formData.phone}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Title:</td>
                    <td style="padding: 8px 0; color: #16252d;">${formData.title}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px;">
                <h2 style="color: #16252d; margin-top: 0; font-size: 20px;">Message</h2>
                <p style="color: #16252d; white-space: pre-wrap; margin: 0;">${formData.message}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (!emailResult.success) {
      console.error('[Contact Form] Failed to send notification email:', emailResult.error)
      // Still return success since submission was saved
    } else {
      console.log('[Contact Form] Notification email sent successfully')
    }

    // Send confirmation email to user
    const confirmationEmailResult = await sendEmail({
      to: formData.email.trim(),
      subject: 'Thank you for contacting Ready to Work',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4644b8 0%, #6366f1 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Contacting Us!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${formData.name},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Thank you for reaching out to Ready to Work. We've received your message and will get back to you as soon as possible.</p>
              <p style="font-size: 16px; margin-bottom: 20px;">Here's a summary of your submission:</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 8px 0; color: #16252d;"><strong>Title:</strong> ${formData.title}</p>
                <p style="margin: 8px 0; color: #16252d;"><strong>Message:</strong></p>
                <p style="margin: 8px 0; color: #16252d; white-space: pre-wrap;">${formData.message}</p>
              </div>
              <p style="font-size: 16px; margin-top: 30px;">We typically respond within 24-48 hours. If you have any urgent questions, please feel free to call us directly.</p>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br>The Ready to Work Team</p>
            </div>
          </body>
        </html>
      `,
    })

    if (!confirmationEmailResult.success) {
      console.error('[Contact Form] Failed to send confirmation email:', confirmationEmailResult.error)
    } else {
      console.log('[Contact Form] Confirmation email sent successfully')
    }

    return {
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
    }
  } catch (error: any) {
    console.error('Contact form submission error:', error)
    return {
      success: false,
      error: error?.message || 'Failed to submit form. Please try again later.',
    }
  }
}
