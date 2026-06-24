type NoCampaignProps = {
  message?: string;
  onCreate?:()=>void;
  onJoin?:()=>void;
};

export default function NoCampaign({
  message = "Você ainda não está vinculada a nenhuma campanha. Entre em uma campanha existente ou crie uma nova para desbloquear este conteúdo.",
  onCreate,
  onJoin,
}: NoCampaignProps) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6">
  <div className="w-full max-w-2xl border border-bege-escuro bg-roxo px-8 py-10 text-center shadow-[0_0_40px_rgba(0,0,0,0.35)]">

    <p className="mb-3 text-sm uppercase tracking-[0.28em] text-bege-escuro font-title">
      Campanha necessária
    </p>

    <p className="mx-auto max-w-xl text-lg leading-8 text-bege-escuro/85 font-title">
      {message}
    </p>

    <div className="mt-8 flex justify-center gap-4">

      <button
        onClick={onCreate}
        className="border border-bege-escuro px-5 py-2 font-title text-sm uppercase"
      >
        Criar campanha
      </button>

      <button
        onClick={onJoin}
        className="border border-bege-escuro px-5 py-2 font-title text-sm uppercase"
      >
        Participar
      </button>

    </div>

  </div>
</section>
  );
}