// Share data without a server: the data is compressed into the link itself (?d=...).
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}
const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

export async function encodeState(data: unknown): Promise<string> {
  return toB64(await pipe(new TextEncoder().encode(JSON.stringify(data)), new CompressionStream("deflate-raw")));
}
export async function decodeState<T>(s: string): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await pipe(fromB64(s), new DecompressionStream("deflate-raw"))));
}
/** Full link to a tool page carrying `data`. */
export async function shareLink(slug: string, data: unknown, extra = "") {
  return `${location.origin}/t/${slug}?${extra ? extra + "&" : ""}d=${await encodeState(data)}`;
}

/** WhatsApp message link. Phone in international format without + (optional). */
export function waLink(text: string, phone = "") {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(text)}`;
}
export function mailLink(to: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Open a new tab right away (so browsers don't block it), then point it at a URL that takes a moment to build. */
export async function openLater(make: () => Promise<string>) {
  const w = window.open("about:blank", "_blank");
  const url = await make();
  if (w) w.location.href = url; else location.href = url;
}
