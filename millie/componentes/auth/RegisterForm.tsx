"use client";
import Image from "next/image";
import { PrimaryButton } from "../PrimaryButton";

interface RegisterFormProps {
  onGoToLogin: () => void;
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#6b6b7b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#6b6b7b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#6b6b7b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export default function RegisterForm({ onGoToLogin }: RegisterFormProps) {
  return (
    <div className="flex w-full flex-col items-center gap-3 animate-in fade-in duration-500">

      <Image src="/assets/svgs/logo.svg" width={48} height={48} alt="" />

      <h1 className="font-title text-roxo text-center text-lg tracking-widest">
        CADASTRO
      </h1>

      <Image src="/assets/svgs/divider.svg" width={160} height={20} alt="" className="opacity-60" />

      <div className="flex w-full flex-col gap-2 mt-1">

        <div className="flex items-center gap-2 border border-roxo/30 bg-bege-claro/40 px-3 py-2">
          <UserIcon />
          <input
            type="text"
            placeholder="Nome de usuário"
            aria-label="Nome de usuário"
            className="w-full bg-transparent text-sm text-roxo placeholder:text-roxo/40 outline-none font-body"
          />
        </div>

        <div className="flex items-center gap-2 border border-roxo/30 bg-bege-claro/40 px-3 py-2">
          <MailIcon />
          <input
            type="email"
            placeholder="E-mail"
            aria-label="E-mail"
            className="w-full bg-transparent text-sm text-roxo placeholder:text-roxo/40 outline-none font-body"
          />
        </div>

        <div className="flex items-center gap-2 border border-roxo/30 bg-bege-claro/40 px-3 py-2">
          <LockIcon />
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
          CADASTRAR
        </PrimaryButton>
      </div>

      <Image src="/assets/svgs/divider.svg" width={160} height={20} alt="" className="opacity-60" />

      <PrimaryButton
        type="button"
        onClick={onGoToLogin}
        className="!h-10 !w-full !text-sm shadow-none hover:bg-bege-medio"
      >
        JÁ TENHO CONTA
      </PrimaryButton>

    </div>
  );
}