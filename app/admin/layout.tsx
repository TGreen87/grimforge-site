export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
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