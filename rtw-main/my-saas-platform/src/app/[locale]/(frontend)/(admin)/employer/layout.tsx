/**
 * Employer section layout: keep LTR layout/UI when locale is AR.
 * Texts are still translated via next-intl; only direction/alignment stay as EN.
 */
export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div dir="ltr">{children}</div>
}
