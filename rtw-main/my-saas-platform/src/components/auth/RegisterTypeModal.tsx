'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { User, Building2, ArrowRight } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { Link } from '@/i18n/routing'

interface RegisterTypeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegisterTypeModal({ open, onOpenChange }: RegisterTypeModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1] || 'en'

  const handleSelect = (type: 'candidate' | 'employer') => {
    onOpenChange(false)
    if (type === 'candidate') {
      router.push(`/${locale}/register`)
    } else {
      router.push(`/${locale}/employer/register`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-[#16252d]">
            Choose Your Account Type
          </DialogTitle>
          <DialogDescription className="text-center text-[#757575]">
            Select whether you're looking for work or hiring talent
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 mt-6">
          {/* Candidate Option */}
          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-center justify-center gap-4 hover:bg-[#4644b8]/5 hover:border-[#4644b8] transition-all group"
            onClick={() => handleSelect('candidate')}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-12 h-12 rounded-full bg-[#4644b8]/10 flex items-center justify-center group-hover:bg-[#4644b8]/20 transition-colors">
                <User className="w-6 h-6 text-[#4644b8]" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-lg text-[#16252d]">Candidate</div>
                <div className="text-sm text-[#757575]">Looking for work opportunities</div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#4644b8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Button>

          {/* Employer Option */}
          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-center justify-center gap-4 hover:bg-[#4644b8]/5 hover:border-[#4644b8] transition-all group"
            onClick={() => handleSelect('employer')}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-12 h-12 rounded-full bg-[#4644b8]/10 flex items-center justify-center group-hover:bg-[#4644b8]/20 transition-colors">
                <Building2 className="w-6 h-6 text-[#4644b8]" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-lg text-[#16252d]">Employer</div>
                <div className="text-sm text-[#757575]">Hiring talent for your company</div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#4644b8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


