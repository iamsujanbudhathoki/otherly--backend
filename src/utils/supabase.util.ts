import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DotenvConfig } from '../config/env.config';

export class SupabaseStorageUtil {
  private static client: SupabaseClient | null = null;

  static getClient(): SupabaseClient {
    if (this.client) {
      return this.client;
    }

    if (!DotenvConfig.SUPABASE_URL || !DotenvConfig.SUPABASE_KEY) {
      throw new Error(
        'Supabase Storage is not configured. SUPABASE_URL and SUPABASE_KEY are required in .env',
      );
    }

    this.client = createClient(
      DotenvConfig.SUPABASE_URL,
      DotenvConfig.SUPABASE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    return this.client;
  }

  static async uploadBuffer(
    buffer: Buffer,
    destinationPath: string,
    mimeType: string,
  ): Promise<{ url: string; path: string }> {
    const client = this.getClient();
    const bucket = DotenvConfig.SUPABASE_STORAGE_BUCKET;
    const cleanPath = destinationPath.replace(/^\/+/, '');

    const { data, error } = await client.storage
      .from(bucket)
      .upload(cleanPath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = client.storage.from(bucket).getPublicUrl(cleanPath);

    return {
      url: publicUrl,
      path: data.path,
    };
  }

  static async deleteFile(destinationPath: string): Promise<void> {
    const client = this.getClient();
    const bucket = DotenvConfig.SUPABASE_STORAGE_BUCKET;
    const cleanPath = destinationPath.replace(/^\/+/, '');

    const { error } = await client.storage.from(bucket).remove([cleanPath]);
    if (error) {
      console.warn(
        `[Supabase Storage] Failed to delete file ${destinationPath}:`,
        error.message,
      );
    }
  }

  static extractPathFromUrl(url: string): string | null {
    if (!url.includes('supabase.co')) {
      return null;
    }
    const bucket = DotenvConfig.SUPABASE_STORAGE_BUCKET;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) {
      return null;
    }
    return url.substring(idx + marker.length);
  }
}
