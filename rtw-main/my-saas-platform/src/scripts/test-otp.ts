/**
 * Test OTP Flow Script
 * 
 * Usage:
 *   pnpm tsx src/scripts/test-otp.ts <phone>
 * 
 * Example:
 *   pnpm tsx src/scripts/test-otp.ts +966501234567
 */

// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file in project root
const envPath = path.resolve(process.cwd(), '.env')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.warn('⚠️  Warning: Could not load .env file:', result.error.message)
} else {
  console.log('✅ Environment variables loaded from:', envPath)
}

const phone = process.argv[2]

if (!phone) {
  console.error('❌ Error: Phone number is required')
  console.log('Usage: pnpm tsx src/scripts/test-otp.ts <phone>')
  console.log('Example: pnpm tsx src/scripts/test-otp.ts +966501234567')
  process.exit(1)
}

async function testOTPFlow() {
  console.log('\n🧪 Testing OTP Flow...\n')
  console.log('Phone:', phone)
  console.log('')

  try {
    // Step 1: Start OTP
    console.log('📤 Step 1: Requesting OTP...')
    const startResponse = await fetch('http://localhost:3000/api/otp/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
      }),
    })

    const startData = await startResponse.json()
    console.log('Response:', startData)

    if (!startData.ok) {
      console.error('❌ Failed to start OTP:', startData.error)
      process.exit(1)
    }

    console.log('✅ OTP sent successfully!')
    console.log('')

    // In dev mode with OTP_DEV_BYPASS, check server logs for OTP
    if (process.env.OTP_DEV_BYPASS === 'true') {
      console.log('⚠️  DEV MODE: Check server console for OTP code')
      console.log('')
    }

    // Step 2: Wait for user input
    console.log('⏳ Waiting for OTP code...')
    console.log('Enter the 6-digit code sent to your phone:')

    // Read from stdin (for testing)
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question('OTP Code: ', async (code: string) => {
      rl.close()

      if (!code || code.length !== 6) {
        console.error('❌ Invalid code format')
        process.exit(1)
      }

      // Step 3: Verify OTP
      console.log('')
      console.log('📥 Step 2: Verifying OTP...')
      const verifyResponse = await fetch('http://localhost:3000/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          code,
        }),
      })

      const verifyData = await verifyResponse.json()
      console.log('Response:', verifyData)

      if (verifyData.ok && verifyData.verified) {
        console.log('✅ OTP verified successfully!')
        process.exit(0)
      } else {
        console.error('❌ OTP verification failed:', verifyData.error)
        process.exit(1)
      }
    })
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

testOTPFlow()

