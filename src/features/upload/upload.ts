import { supabase } from '../../lib/supabase';

interface UploadOptions {
  bucket: string;
  path: string;
  fileUri: string;
  contentType: string;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

/**
 * Uploads a file to Supabase Storage using XMLHttpRequest to track progress.
 * This is necessary because the official Supabase JS client doesn't support
 * upload progress in React Native out of the box.
 */
export async function uploadFileWithProgress({
  bucket,
  path,
  fileUri,
  contentType,
  onProgress,
  signal,
}: UploadOptions): Promise<{ data: any; error: Error | null }> {
  return new Promise(async (resolve) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      // Prepare the file object for XHR
      // In React Native, passing an object with uri, type, name to FormData or XHR body works for local files.
      const fileToUpload = {
        uri: fileUri,
        type: contentType,
        name: path.split('/').pop() || 'upload.tmp',
      };

      const xhr = new XMLHttpRequest();
      const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

      xhr.open('POST', uploadUrl, true);
      
      // Use the anon key and user's session token
      xhr.setRequestHeader('apikey', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      // Important for Supabase Storage
      xhr.setRequestHeader('Content-Type', contentType);

      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(event.loaded / event.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let responseData = {};
          try {
            responseData = JSON.parse(xhr.responseText);
          } catch (e) {}
          resolve({ data: responseData, error: null });
        } else {
          let errorMsg = 'Upload failed';
          try {
            const err = JSON.parse(xhr.responseText);
            errorMsg = err.message || errorMsg;
          } catch (e) {}
          resolve({ data: null, error: new Error(errorMsg) });
        }
      };

      xhr.onerror = () => {
        resolve({ data: null, error: new Error('Network error during upload') });
      };

      xhr.onabort = () => {
        resolve({ data: null, error: new Error('Upload cancelled') });
      };

      // Send the raw file object. In RN this maps to the file content natively.
      // @ts-ignore
      xhr.send(fileToUpload);
    } catch (err: any) {
      resolve({ data: null, error: err });
    }
  });
}
