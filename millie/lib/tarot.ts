export const MAJOR_ARCANA = [
  'louco', 'mago', 'sacerdotisa', 'imperatriz', 'imperador', 'papa', 'enamorados',
  'carruagem', 'justica', 'eremita', 'roda-fortuna', 'forca', 'enforcado', 'morte',
  'temperanca', 'diabo', 'torre', 'estrela', 'lua', 'sol', 'julgamento', 'mundo',
] as const

export type MajorArcanaSlug = typeof MAJOR_ARCANA[number]

export const MAJOR_ARCANA_LABELS: Record<MajorArcanaSlug, string> = {
  louco: 'O Louco', mago: 'O Mago', sacerdotisa: 'A Sacerdotisa', imperatriz: 'A Imperatriz',
  imperador: 'O Imperador', papa: 'O Papa', enamorados: 'Os Enamorados', carruagem: 'A Carruagem',
  justica: 'A Justiça', eremita: 'O Eremita', 'roda-fortuna': 'A Roda da Fortuna', forca: 'A Força',
  enforcado: 'O Enforcado', morte: 'A Morte', temperanca: 'A Temperança', diabo: 'O Diabo',
  torre: 'A Torre', estrela: 'A Estrela', lua: 'A Lua', sol: 'O Sol', julgamento: 'O Julgamento', mundo: 'O Mundo',
}

export function cardsRequired(readingType: 'COMUM' | 'PROFUNDA') {
  return readingType === 'COMUM' ? 3 : 5
}
