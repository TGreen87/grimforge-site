import { getSupabaseBrowserClient } from '@/integrations/supabase/browser'

export class StorageService {
  private get supabase() { return getSupabaseBrowserClient() }
  private bucketName = 'products'

  async uploadFile(
    file: File,
    path: string,
    options?: {
      upsert?: boolean
      contentType?: string
    }
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(path, file, {
          upsert: options?.upsert ?? false,
          contentType: options?.contentType ?? file.type,
        })

      if (error) {
        return { url: null, error }
      }

      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path)

      return { url: publicUrl, error: null }
    } catch (error) {
      return { url: null, error: error as Error }
    }
  }

  async uploadMultipleFiles(
    files: File[],
    basePath: string
  ): Promise<{ urls: string[]; errors: Error[] }> {
    const urls: string[] = []
    const errors: Error[] = []

    for (const file of files) {
      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name}`
      const path = `${basePath}/${fileName}`

      const { url, error } = await this.uploadFile(file, path)

      if (url) {
        urls.push(url)
      }
      if (error) {
        errors.push(error)
      }
    }

    return { urls, errors }
  }

  async deleteFile(path: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path])

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async deleteMultipleFiles(paths: string[]): Promise<{ errors: Error[] }> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove(paths)

      if (error) {
        return { errors: [error] }
      }

      return { errors: [] }
    } catch (error) {
      return { errors: [error as Error] }
    }
  }

  async listFiles(
    path: string,
    options?: {
      limit?: number
      offset?: number
      sortBy?: {
        column: string
        order: 'asc' | 'desc'
      }
    }
  ) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(path, {
          limit: options?.limit ?? 100,
          offset: options?.offset ?? 0,
          sortBy: options?.sortBy ?? { column: 'name', order: 'asc' },
        })

      if (error) {
        return { files: [], error }
      }

      return { files: data || [], error: null }
    } catch (error) {
      return { files: [], error: error as Error }
    }
  }

  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path)

    return data.publicUrl
  }

  async createSignedUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(path, expiresIn)

      if (error) {
        return { url: null, error }
      }

      return { url: data.signedUrl, error: null }
    } catch (error) {
      return { url: null, error: error as Error }
    }
  }

  async downloadFile(path: string): Promise<{ data: Blob | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(path)

      return { data, error }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}

export const storageService = new StorageService()