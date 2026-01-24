import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { Footer } from '@/components/homepage/blocks/Footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HomepageSection } from '@/components/homepage/HomepageSection'
import { generateMeta } from '@/utilities/generateMeta'
import { getPageBySlug } from '@/utilities/getPageBySlug'

export async function generateMetadata(): Promise<Metadata> {
  const customRequestPage = await getPageBySlug('custom-request')
  return generateMeta({ doc: customRequestPage })
}

export default async function CustomRequestPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      
      <main className="pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12">
        <HomepageSection>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl">Custom Plan Request</CardTitle>
              <CardDescription>
                Please contact us to discuss your custom pricing requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm sm:text-base text-[#757575]">
                For custom plans, please reach out to our sales team to discuss your specific needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-[#4644b8] hover:bg-[#3a3aa0]">
                  <a href="mailto:sales@readytowork.sa">Contact Sales</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/pricing">Back to Pricing</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </HomepageSection>
      </main>

      <Footer />
    </div>
  )
}






