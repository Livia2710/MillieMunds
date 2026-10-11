'use client'
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Compass, Plus, Trash2, Edit3, Eye, LoaderCircle, EyeOff} from 'lucide-react'
import { useCampaign } from '@/lib/contexts/CampaignContext'
import { createExplorationMap, deleteExplorationMap, listExplorationMaps} from '@/app/actions/exploration'
import type { ExplorationMapRecord } from '@/lib/types/exploration'
import PlayerExplore from './PlayerExplore'

export default function MapsHome() {
  const { isMaster, hasCampaign, loading: contextLoading } = useCampaign()
  const [maps, setMaps] = useState<ExplorationMapRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [asPlayer, setAsPlayer] = useState(false)
  const router = useRouter()

  async function refresh() {
    try {
      setMaps(await listExplorationMaps())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar mapas')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    if (!contextLoading && hasCampaign && isMaster) {
      void refresh()
    }
  }, [contextLoading, hasCampaign, isMaster])

  async function create() {
    try {
      const mapName = window.prompt('Qual será o nome deste mapa?', 'Novo mapa')
      if (mapName === null) return
      const id = await createExplorationMap(mapName)
      router.push(`/mapas/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar mapa')
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir este mapa permanentemente?')) return

    try {
      await deleteExplorationMap(id)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  if (contextLoading) {
    return (
      <div className="py-24 text-center text-bege-medio">
        <LoaderCircle className="mx-auto animate-spin" />
      </div>
    )
  }

  if (!hasCampaign) {
    return (
      <div className="py-24 text-center text-bege-medio">
        Entre em uma campanha para acessar os mapas.
      </div>
    )
  }

  if (!isMaster) return <PlayerExplore />

  if (loading) {
    return (
      <div className="py-24 text-center text-bege-medio">
        <LoaderCircle className="mx-auto animate-spin" />
      </div>
    )
  }

  if (asPlayer) {
    return (
      <div>
        <div className="mx-auto flex max-w-6xl justify-end px-4 pt-6 md:px-8">
          <button
            onClick={() => setAsPlayer(false)}
            aria-label="Voltar à visão do Mestre"
            className="flex items-center gap-2 border border-bege-medio/50 px-3 py-2 font-title text-xs uppercase tracking-widest"
          >
            <EyeOff size={15} />
            Visão do Mestre
          </button>
        </div>
        <PlayerExplore />
      </div>
    )
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 text-bege-claro md:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-bege-escuro/30 pb-5">
        <div>
          <p className="mb-2 flex items-center gap-2 font-title text-xs uppercase tracking-[.25em] text-bege-medio">
            <Compass size={16} />
            Exploração compartilhada
          </p>
          <h1 className="font-title text-3xl uppercase tracking-[.15em]">
            Mapas
          </h1>
          <p className="mt-2 text-sm text-bege-escuro/70">
            {isMaster
              ? 'Crie salas, configure passagens e publique a exploração para o grupo.'
              : 'O grupo compartilha a sala atual e os itens encontrados.'}
          </p>
        </div>

        {isMaster && (
          <div className="flex gap-2">
            <button
              onClick={() => setAsPlayer(true)}
              aria-label="Ver como jogador"
              className="flex items-center gap-2 border border-bege-escuro/40 px-4 py-3 font-title text-xs uppercase tracking-widest"
            >
              <Eye size={16} />
              Ver como jogador
            </button>
            <button
              onClick={create}
              className="flex items-center gap-2 border border-bege-medio/50 bg-roxo px-4 py-3 font-title text-xs uppercase tracking-widest text-bege-claro hover:bg-bege-escuro/10"
            >
              <Plus size={16} />
              Criar mapa
            </button>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-5 border border-red-400/30 bg-red-950/20 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      {maps.length === 0 ? (
        <section className="border border-bege-escuro/20 bg-roxo-escuro/30 p-12 text-center">
          <BookOpen className="mx-auto mb-4 text-bege-medio" />
          <h2 className="font-title text-lg uppercase tracking-widest">
            Nenhum mapa ainda
          </h2>
          <p className="mt-2 text-sm text-bege-escuro/70">
            {isMaster
              ? 'Crie um mapa para desenhar a primeira sala.'
              : 'O Mestre ainda não publicou um mapa.'}
          </p>
        </section>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {maps.map((map) => (
            <article
              key={map.id}
              className="border border-bege-escuro/25 bg-roxo-escuro/40 p-5"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="font-title text-lg uppercase tracking-wider">
                    {map.name}
                  </h2>
                  <p className="mt-1 text-xs text-bege-escuro/70">
                    {map.rooms.length} sala(s) ·{' '}
                    {map.isEditing
                      ? 'Em edição'
                      : map.isPublished
                        ? 'Publicado'
                        : 'Rascunho'}
                  </p>
                </div>
                <Compass className="text-bege-medio" />
              </div>

              {isMaster ? (
                <div className="flex gap-2">
                  <Link
                    href={`/mapas/${map.id}`}
                    className="flex flex-1 items-center justify-center gap-2 border border-bege-escuro/30 py-2 text-xs uppercase tracking-widest hover:bg-bege-escuro/10"
                  >
                    <Edit3 size={14} />
                    Editar
                  </Link>
                  <button
                    aria-label="Excluir mapa"
                    onClick={() => void remove(map.id)}
                    className="border border-red-400/30 px-3 text-red-300 hover:bg-red-950/30"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-sm text-bege-medio">
                  <Eye size={15} />
                  {map.isEditing
                    ? 'O Mestre está editando'
                    : 'Pronto para explorar'}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
