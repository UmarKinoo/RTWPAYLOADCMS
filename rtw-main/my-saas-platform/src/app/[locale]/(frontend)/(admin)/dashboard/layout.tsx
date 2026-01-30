/**
 * Candidate dashboard layout: keep UI LTR regardless of locale.
 * Only text content is translated; layout and alignment stay left-to-right.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div dir="ltr">{children}</div>
}
