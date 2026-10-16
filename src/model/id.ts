const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

export function newId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  let out = ''
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return `${prefix}_${out}`
}
