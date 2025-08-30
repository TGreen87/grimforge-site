import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Return the favicon.ico file
  const response = await fetch(new URL('/favicon.ico', request.url))
  return response
}
