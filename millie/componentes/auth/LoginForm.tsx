"use client";
import Image from 'next/image';
import { PrimaryButton } from "../PrimaryButton";

export default function LoginForm() {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col">
        <Image
        src="/assets/svgs/logo.svg"
        width={60}
        height={60}
        alt=""
        className="
        absolute
        inset-0
        top-8
        left-[42%]
        "
        />
      <h1 className="mt-10 font-title text-bege-medio text-center text-xl">
        BEM-VINDO(A)
      </h1>
       <Image
        src="/assets/svgs/divider.svg"
        width={120}
        height={120}
        alt=""
        className="
        absolute
        inset-0
        top-8
        left-[42%]
        "
        />

      
      <input
        type="text"
        placeholder="Usuário ou e-mail"
        aria-label="Usuário ou e-mail"
        className="border-bege-escuro w-full border bg-transparent p-3 text-sm outline-none"
      />

      <input
        type="password"
        placeholder="Senha"
        aria-label="Senha"
        className="border-bege-escuro mt-3 w-full border bg-transparent p-3 text-sm outline-none"
      />

      <div className="mt-6 ml-[-18px]">
        <PrimaryButton type="submit">
          ENTRAR
        </PrimaryButton>
      </div>
    </form>
  );
}
