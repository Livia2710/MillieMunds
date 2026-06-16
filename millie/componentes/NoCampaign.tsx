type NoCampaignProps = {
  message?: string;
};

export default function NoCampaign({
  message = "Você ainda não está vinculada a nenhuma campanha. Entre em uma campanha existente ou crie uma nova para desbloquear este conteúdo.",
}: NoCampaignProps) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-2xl border border-[#b99b5f]/60 bg-[#140b18]/80 px-8 py-10 text-center shadow-[0_0_40px_rgba(0,0,0,0.35)]">
        <p className="mb-3 text-sm uppercase tracking-[0.28em] text-[#b99b5f]">
          Campanha necessária
        </p>


        <p className="mx-auto max-w-xl text-lg leading-8 text-[#d8c07a]/85">
          {message}
        </p>
      </div>
    </section>
  );
}