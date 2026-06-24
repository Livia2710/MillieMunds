"use client";
import Image from "next/image";
import { PrimaryButton } from "../PrimaryButton";

interface LoginFormProps {
  onGoToRegister: () => void;
}

export default function LoginForm({ onGoToRegister }: LoginFormProps) {
  return (
    <div className="flex w-full flex-col items-center gap-3 animate-in fade-in duration-500">

      <Image src="/assets/svgs/logo.svg" width={48} height={48} alt="" />

      <h1 className="font-title text-roxo text-center text-lg tracking-widest">
        BEM-VINDO(A)
      </h1>

      <Image src="/assets/svgs/divider.svg" width={160} height={20} alt="" className="opacity-60" />

      <div className="flex w-full flex-col gap-2 mt-1">

        {/* Usuário */}
        <div className="flex items-center gap-2 border border-roxo/30 bg-bege-claro/40 px-3 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#6b6b7b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input
            type="text"
            placeholder="Usuário ou e-mail"
            aria-label="Usuário ou e-mail"
            className="w-full bg-transparent text-sm text-roxo placeholder:text-roxo/40 outline-none font-body"
          />
        </div>

        {/* Senha */}
        <div className="flex items-center gap-2 border border-roxo/30 bg-bege-claro/40 px-3 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#6b6b7b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            type="password"
            placeholder="Senha"
            aria-label="Senha"
            className="w-full bg-transparent text-sm text-roxo placeholder:text-roxo/40 outline-none font-body"
          />
        </div>

      </div>

      <div className="mt-2 w-full">
        <PrimaryButton type="submit" className="!h-10 !w-full !text-sm !bg-roxo shadow-none">
          ENTRAR
        </PrimaryButton>
      </div>

      <Image src="/assets/svgs/divider.svg" width={160} height={20} alt="" className="opacity-60" />

      <PrimaryButton
        type="button"
        onClick={onGoToRegister}
        className="!h-10 !w-full !text-sm shadow-none hover:bg-bege-medio"
      >
        CADASTRE
      </PrimaryButton>

    </div>
  );
}