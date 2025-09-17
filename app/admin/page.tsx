import { redirect } from 'next/navigation'

export default function AdminIndexPage() {
  // Default landing for /admin → dashboard
  redirect('/admin/dashboard')
}
