export const dynamic = 'force-dynamic'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto space-y-12">
        {children}
      </div>
    </div>
  )
}
