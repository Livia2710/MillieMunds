import Image from 'next/image';

export default function ClosedBook() {
  return (
    <>
    <div className="relative h-[68vh] w-95 md:h-[76vh] md:w-[28vw] ">
      <Image 
        src="/assets/svgs/carta.svg" 
        fill 
        alt="Moldura decorativa" 
        className="absolute bg-roxo" 
      />
      
    </div>
     <p className="font-title text-bege-medio absolute bottom-10 w-full text-center text-xs">
        CLIQUE PARA ABRIR
      </p>
    </>
  );
}
