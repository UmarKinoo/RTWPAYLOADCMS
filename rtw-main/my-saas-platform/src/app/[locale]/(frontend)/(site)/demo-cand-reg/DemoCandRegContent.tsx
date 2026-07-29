'use client'

import { HomepageNavbar } from '@/components/homepage/Navbar'
import { EscoWizard } from '@/components/demo-cand-reg/EscoWizard'

export function DemoCandRegContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HomepageNavbar />
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12">
        <div className="container mx-auto px-4 sm:px-6">
          <EscoWizard />
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-200">
        <p>&copy; {new Date().getFullYear()} ReadyToWork. All rights reserved.</p>
      </footer>
    </div>
  )
}
