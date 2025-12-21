#!/usr/bin/env node

/**
 * Cleanup script for Next.js .next directory
 * Handles Windows file locking issues by retrying with delays
 */

import { rm, chmod } from 'fs/promises'
import { existsSync, statSync } from 'fs'
import { join } from 'path'
import { platform } from 'os'

const NEXT_DIR = join(process.cwd(), '.next')

async function cleanup() {
  // On Windows, stop Node processes first to release locks
  if (platform() === 'win32') {
    try {
      const { execSync } = await import('child_process')
      console.log('Stopping Node.js processes on Windows...')
      execSync('taskkill /F /IM node.exe 2>nul', { stdio: 'ignore' })
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (e) {
      // Ignore errors - processes may not exist
    }
  }

  if (!existsSync(NEXT_DIR)) {
    console.log('✓ .next directory does not exist, nothing to clean')
    return
  }

  console.log('Cleaning .next directory...')
  
  // Try to remove with retries
  const maxRetries = 5
  const retryDelay = 1000 // 1 second

  // On Windows, try to clear read-only attributes first
  if (platform() === 'win32') {
    try {
      const { execSync } = await import('child_process')
      execSync(`attrib -r "${NEXT_DIR}\\*.*" /s /d`, { stdio: 'ignore' })
    } catch (e) {
      // Ignore errors from attrib command
    }
  }

  for (let i = 0; i < maxRetries; i++) {
    try {
      await rm(NEXT_DIR, { recursive: true, force: true, maxRetries: 3 })
      console.log('✓ .next directory removed successfully')
      return
    } catch (error) {
      if (error.code === 'EPERM' || error.code === 'EBUSY' || error.code === 'EACCES') {
        if (i < maxRetries - 1) {
          console.log(`⚠ Locked file detected (${error.code}), retrying in ${retryDelay}ms... (attempt ${i + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        } else {
          console.error('✗ Failed to remove .next directory after multiple attempts')
          console.error('  Error:', error.code)
          console.error('  Please make sure no Next.js dev server is running')
          console.error('  You can stop it with: Ctrl+C in the terminal where it\'s running')
          console.error('  Or manually: Get-Process node | Stop-Process -Force')
          process.exit(1)
        }
      } else {
        throw error
      }
    }
  }
}

cleanup().catch(error => {
  console.error('Error during cleanup:', error.message)
  process.exit(1)
})

