/**
 * Compress + base64-encode a JSON string for use in QR codes.
 * Tries gzip first (Chrome/Firefox/Edge), then deflate-raw (Safari/iOS),
 * then falls back to plain JSON if neither works.
 *
 * Prefix in the output tells the decoder which format was used:
 *   "gz:" — gzip
 *   "df:" — deflate-raw
 *   (no prefix) — uncompressed
 */

function toBase64(bytes: Uint8Array): string {
  // Use chunks to avoid stack overflow on large arrays
  const CHUNK = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function fromBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function streamCompress(
  input: Uint8Array,
  format: CompressionFormat,
): Promise<Uint8Array> {
  const cs = new CompressionStream(format);
  const writer = cs.writable.getWriter();
  // Write a copy as a plain ArrayBuffer to avoid SharedArrayBuffer type issues
  const buf = input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength,
  ) as ArrayBuffer;
  writer.write(new Uint8Array(buf));
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

async function streamDecompress(
  input: Uint8Array,
  format: CompressionFormat,
): Promise<string> {
  const ds = new DecompressionStream(format);
  const writer = ds.writable.getWriter();
  const buf = input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength,
  ) as ArrayBuffer;
  writer.write(new Uint8Array(buf));
  writer.close();
  const chunks: Uint8Array[] = [];
  const reader = ds.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return new TextDecoder().decode(out);
}

export async function compressToBase64(data: string): Promise<string> {
  if (typeof CompressionStream === "undefined") return data;
  const encoded = new TextEncoder().encode(data);
  const formats: Array<[CompressionFormat, string]> = [
    ["gzip", "gz:"],
    ["deflate-raw", "df:"],
  ];
  for (const [format, prefix] of formats) {
    try {
      const compressed = await streamCompress(encoded, format);
      // Only use compression if it actually shrinks the data
      const b64 = toBase64(compressed);
      if (prefix.length + b64.length < data.length) {
        return prefix + b64;
      }
    } catch {
      // format unsupported or failed, try next
    }
  }
  return data;
}

export async function decompressFromBase64(data: string): Promise<string> {
  if (data.startsWith("gz:")) {
    return streamDecompress(fromBase64(data.slice(3)), "gzip");
  }
  if (data.startsWith("df:")) {
    return streamDecompress(fromBase64(data.slice(3)), "deflate-raw");
  }
  return data; // plain JSON — old QR or compression not available
}
