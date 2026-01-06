import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const SubmitButton = ({ 
  loading, 
  text, 
  className 
}: { 
  loading: boolean
  text: string
  className?: string
}) => {
  return (
    <Button type="submit" disabled={loading} className={cn(className)}>
      {loading ? <Loader2 className="animate-spin" /> : text}
    </Button>
  )
}
