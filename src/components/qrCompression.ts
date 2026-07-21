/**
 * Compress a string using the best available CompressionStream format,
 * then base64-encode it with a prefix indicating the format:
 *   "gz:"  — gzip (Chrome, Firefox, Edge)
 *   "df:"  — deflate-raw (Safari / iOS)
 *   (no prefix) — uncompressed fallback
 */

async function compressWith(
  data: Uint8Array,
  format: CompressionFormat,
): Promise<Uint8Array> {
  const cs = new CompressionStream(format);
  const writer = cs.writable.getWriter();
  writer.write(
    data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer,
  );
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function decompressWith(
  data: Uint8Array,
  format: CompressionFormat,
): Promise<string> {
  const ds = new DecompressionStream(format);
  const writer = ds.writable.getWriter();
  writer.write(
    data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer,
  );
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(result);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function compressToBase64(data: string): Promise<string> {
  if (typeof CompressionStream === "undefined") return data;
  const encoded = new TextEncoder().encode(data);
  // Try gzip first (Chrome/Firefox/Edge), fall back to deflate-raw (Safari/iOS)
  for (const [format, prefix] of [
    ["gzip", "gz:"],
    ["deflate-raw", "df:"],
  ] as const) {
    try {
      const compressed = await compressWith(encoded, format);
      return prefix + toBase64(compressed);
    } catch {
      // format not supported, try next
    }
  }
  return data; // uncompressed fallback
}

export async function decompressFromBase64(data: string): Promise<string> {
  if (data.startsWith("gz:")) {
    return decompressWith(fromBase64(data.slice(3)), "gzip");
  }
  if (data.startsWith("df:")) {
    return decompressWith(fromBase64(data.slice(3)), "deflate-raw");
  }
  // No prefix — plain JSON (uncompressed or old QR code)
  return data;
}
