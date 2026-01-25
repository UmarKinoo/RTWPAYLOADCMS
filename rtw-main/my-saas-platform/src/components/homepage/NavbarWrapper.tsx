import { getCurrentEmployer } from '@/lib/employer'
import { getCurrentCandidate } from '@/lib/candidate'
import { HomepageNavbar } from './Navbar'
import { BottomNav } from './BottomNav'

/**
 * Server component wrapper that fetches employer and candidate data
 * and passes it to the client Navbar component
 */
export async function HomepageNavbarWrapper() {
  const employer = await getCurrentEmployer()
  const candidate = await getCurrentCandidate()
  
  return (
    <>
      <HomepageNavbar employer={employer} candidate={candidate} />
      <BottomNav employer={employer} candidate={candidate} />
    </>
  )
}

