/**
 * Compress a string with gzip via the browser's CompressionStream API,
 * then return a base64-encoded result prefixed with "gz:" so the decoder
 * knows to decompress it.
 *
 * Falls back to returning the raw string if CompressionStream is unavailable.
 */
export async function compressToBase64(data: string): Promise<string> {
  if (typeof CompressionStream === "undefined") return data;
  const encoded = new TextEncoder().encode(data);
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(encoded);
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
  // Convert to base64
  let binary = "";
  for (let i = 0; i < result.length; i++) binary += String.fromCharCode(result[i]);
  return "gz:" + btoa(binary);
}

/**
 * Decompress a value produced by compressToBase64.
 * If it doesn't start with "gz:" it is treated as plain JSON and returned as-is.
 */
export async function decompressFromBase64(data: string): Promise<string> {
  if (!data.startsWith("gz:")) return data;
  const binary = atob(data.slice(3));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DecompressionStream not supported");
  }
  const ds = new DecompressionStream("gzip");
  const writer = ds.writable.getWriter();
  writer.write(bytes);
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
