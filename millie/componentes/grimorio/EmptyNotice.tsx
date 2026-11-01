import { BookOpen } from 'lucide-react'

export function EmptyNotice({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-dashed border-bege-medio/30 px-5 py-10 text-center">
    <BookOpen className="mx-auto mb-3 text-bege-medio/60" size={27}/>
    <h3 className="font-title text-lg text-bege-claro">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-bege-claro/60">{text}</p>
  </div>
}
