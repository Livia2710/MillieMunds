import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import sharp from 'sharp'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 4 * 1024 * 1024
const MAX_NORMALIZED_SIZE = 8 * 1024 * 1024
const MAX_IMAGE_PIXELS = 12_000_000
type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/svg+xml'

async function detectImageType(file: File): Promise<ImageMimeType | null> {
  const bytes = new Uint8Array(await file.slice(0, 512).arrayBuffer())
  const prefix = new TextDecoder().decode(bytes).replace(/^\uFEFF/, '').trimStart()
  if (file.type === 'image/svg+xml' && /^(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg\b/i.test(prefix)) return 'image/svg+xml'

  if (bytes.length >= 8 && bytes.subarray(0, 8).every((byte, index) =>
    byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]
  )) return 'image/png'

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }

  const riffSize = bytes.length >= 8
    ? bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24)
    : -1
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP' &&
    riffSize + 8 === file.size
  ) return 'image/webp'

  return null
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const form = await request.formData()
  const file = form.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'A imagem deve ter no máximo 4 MB.' }, { status: 413 })
  }

  const detectedType = await detectImageType(file)
  if (!detectedType || file.type !== detectedType) {
    return NextResponse.json({ error: 'O conteúdo precisa corresponder a uma imagem SVG, PNG, JPG ou WEBP.' }, { status: 415 })
  }

  let imageBuffer: Buffer
  try {
    const input = Buffer.from(await file.arrayBuffer())
    if (detectedType === 'image/svg+xml') {
      const svg = input.toString('utf8')
      const dangerousMarkup = /<!DOCTYPE|<!ENTITY|<\s*(?:script|foreignObject|iframe|object|embed|audio|video)\b|\bon[a-z]+\s*=|@import/i
      const externalReference = /(?:href|src)\s*=\s*['"]?\s*(?:https?:|\/\/|file:|data:|javascript:)/i
      const hasExternalCssReference = [...svg.matchAll(/url\s*\(\s*([^)]*)\)/gi)].some(([, raw]) => !raw.trim().replace(/^['"]|['"]$/g, '').startsWith('#'))
      if (!/<svg\b[\s\S]*<\/svg\s*>/i.test(svg) || dangerousMarkup.test(svg) || externalReference.test(svg) || hasExternalCssReference) {
        return NextResponse.json({ error: 'O SVG contém conteúdo ativo ou referências externas e não pode ser enviado.' }, { status: 415 })
      }
      // O vetor é validado e rasterizado antes de ir para o Blob; SVG nunca é servido diretamente.
    }
    const image = sharp(input, { failOn: 'error', limitInputPixels: MAX_IMAGE_PIXELS, animated: false })
    const metadata = await image.metadata()
    const expectedFormat = detectedType === 'image/jpeg' ? 'jpeg' : detectedType.split('/')[1]
    if (
      (detectedType !== 'image/svg+xml' && metadata.format !== expectedFormat) ||
      !metadata.width || !metadata.height ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS
    ) {
      return NextResponse.json({ error: 'A imagem é inválida ou excede a resolução permitida.' }, { status: 415 })
    }

    const normalizedImage = image.rotate().resize({ width: 4_000, height: 4_000, fit: 'inside', withoutEnlargement: true })
    imageBuffer = detectedType === 'image/svg+xml'
      ? await normalizedImage.webp({ quality: 88 }).toBuffer()
      : detectedType === 'image/jpeg'
      ? await normalizedImage.jpeg({ quality: 85, mozjpeg: true }).toBuffer()
      : detectedType === 'image/png'
        ? await normalizedImage.png({ compressionLevel: 9 }).toBuffer()
        : await normalizedImage.webp({ quality: 85 }).toBuffer()
    if (imageBuffer.length > MAX_NORMALIZED_SIZE) {
      return NextResponse.json({ error: 'A imagem reprocessada excede o tamanho permitido.' }, { status: 413 })
    }
  } catch {
    return NextResponse.json({ error: 'Não foi possível processar esta imagem.' }, { status: 415 })
  }

  const extension = detectedType === 'image/svg+xml' ? 'webp' : detectedType === 'image/jpeg' ? 'jpg' : detectedType.split('/')[1]
  const contentType = detectedType === 'image/svg+xml' ? 'image/webp' : detectedType
  const blob = await put(`millie/${session.user.id}/${crypto.randomUUID()}.${extension}`, imageBuffer, {
    access: 'public',
    contentType,
  })

  return NextResponse.json({ url: blob.url })
}
