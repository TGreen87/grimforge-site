import { redirect } from 'next/navigation'

export default function AdminIndexPage() {
  // Default landing for /admin → products
  redirect('/admin/products')
}

