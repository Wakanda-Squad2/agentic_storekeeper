export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type UploadWithProgressOptions = {
  onProgress?: (p: UploadProgress) => void;
  signal?: AbortSignal;
  /** Network retries after connection failure (not 4xx). */
  retries?: number;
  /** Applied after `open` (e.g. `x-tenant-id` for FastAPI). */
  headers?: HeadersInit;
  /** Default false (cross-origin FastAPI). Use true for same-origin `/api/bridge` with cookies. */
  withCredentials?: boolean;
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Multipart upload with XMLHttpRequest for real progress events.
 * Validates status; caller parses JSON + Zod.
 */
export async function uploadFormWithProgress(
  url: string,
  formData: FormData,
  options: UploadWithProgressOptions = {},
): Promise<{ status: number; bodyText: string }> {
  const retries = options.retries ?? 2;
  let attempt = 0;

  while (true) {
    try {
      return await xhrPost(url, formData, options);
    } catch (e) {
      const retryable =
        e instanceof TypeError ||
        (e instanceof Error && /network|load failed|abort/i.test(e.message));
      if (retryable && attempt < retries) {
        attempt += 1;
        await delay(400 * attempt);
        continue;
      }
      throw e;
    }
  }
}

function xhrPost(
  url: string,
  formData: FormData,
  options: UploadWithProgressOptions,
): Promise<{ status: number; bodyText: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = options.withCredentials ?? false;
    if (options.headers) {
      new Headers(options.headers).forEach((v, k) => {
        xhr.setRequestHeader(k, v);
      });
    }

    if (options.signal) {
      if (options.signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      options.signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new DOMException("Aborted", "AbortError"));
      });
    }

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        options.onProgress?.({
          loaded: ev.loaded,
          total: ev.total,
          percent: Math.round((ev.loaded / ev.total) * 100),
        });
      } else {
        options.onProgress?.({
          loaded: ev.loaded,
          total: 0,
          percent: 0,
        });
      }
    };

    xhr.onerror = () =>
      reject(new TypeError("Network error during upload"));
    xhr.onload = () => {
      resolve({ status: xhr.status, bodyText: xhr.responseText ?? "" });
    };

    xhr.send(formData);
  });
}
