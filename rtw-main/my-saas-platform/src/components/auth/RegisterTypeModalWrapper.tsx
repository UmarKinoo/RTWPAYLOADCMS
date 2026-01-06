'use client'

import { usePathname, useRouter } from 'next/navigation'

interface RegisterTypeModalWrapperProps {
  children: React.ReactNode
}

export function RegisterTypeModalWrapper({ children }: RegisterTypeModalWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = pathname.split('/')[1] || 'en'

  const handleClick = () => {
    router.push(`/${locale}/register-type`)
  }

  return (
    <span onClick={handleClick} className="cursor-pointer">
      {children}
    </span>
  )
}


