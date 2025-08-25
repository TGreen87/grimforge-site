export async function getArticle(slug: string) {
  // Articles table doesn't exist yet, return mock data
  return {
    title: 'Sample Article',
    slug,
    description: 'This is a sample article description',
    content: 'Article content will be displayed here once the articles table is created.',
    image_url: '/placeholder.svg',
    author: 'Grimforge Studios',
    excerpt: 'This is a sample article description',
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}