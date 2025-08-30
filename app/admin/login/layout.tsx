export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
import { LoginRefineProvider } from "../providers/login-refine-provider";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LoginRefineProvider>
      {children}
    </LoginRefineProvider>
  )
}
