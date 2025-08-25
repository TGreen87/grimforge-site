import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

export default function HomePage() {
  return (
    <main>
      {/* Homepage doesn't need breadcrumbs but we can add site-wide structured data */}
      <BreadcrumbJsonLd
        items={[
          { name: 'Home' }
        ]}
      />
      
      <h1>Welcome to Obsidian Rite Records</h1>
      <p>This page will be migrated from the existing Index.tsx component</p>
    </main>
  )
}