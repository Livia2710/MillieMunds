import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const MAX_FILE_SIZE = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

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
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Envie uma imagem PNG, JPG ou WEBP.' }, { status: 415 })
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'A imagem deve ter no máximo 4 MB.' }, { status: 413 })
  }

  const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
  const blob = await put(`millie/${session.user.id}/${crypto.randomUUID()}.${extension}`, file, {
    access: 'public',
  })

  return NextResponse.json({ url: blob.url })
}
