import { RefineProvider } from "./providers/refine-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RefineProvider>
      {children}
    </RefineProvider>
  )
}