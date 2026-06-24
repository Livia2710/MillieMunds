"use client";

import Image from "next/image";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface OpenBookProps {
  mode: "login" | "register";
  pulsing: boolean;
  onSwitch: (to: "login" | "register") => void;
  isEntering?: boolean;
}

export default function OpenBook({ mode, pulsing, onSwitch, isEntering }: OpenBookProps) {
  return (
    <div className="relative h-[68vh] w-95 md:h-[76vh] md:w-[28vw]">

      {/* Fundo bege com textura — revela junto com a energia */}
      <div
        className={`absolute inset-2 z-0 transition-opacity duration-700 ${isEntering ? "opacity-0" : "opacity-100"}`}
        style={{
          backgroundColor: "#f0e8d5",
          backgroundImage: "url('/assets/images/paper.png')",
          backgroundSize: "cover",
          backgroundBlendMode: "multiply",
        }}
      />

      {/* Moldura SVG */}
      <Image
        src="/assets/svgs/moldura.svg"
        fill
        alt="Moldura decorativa"
        className={`absolute z-10 pointer-events-none transition-opacity duration-500 ${isEntering ? "opacity-0" : "opacity-100"}`}
      />

      {/* ENERGIA — acima de tudo */}
      <div className={`border-energy-wrap ${pulsing ? "border-energy-pulse" : ""} ${isEntering ? "border-energy-entering" : ""}`}>
        <div className="border-snake border-snake-top-1" />
        <div className="border-snake border-snake-top-2" />
        <div className="border-snake border-snake-bot-1" />
        <div className="border-snake border-snake-bot-2" />
        <div className="border-snake border-snake-left-1" />
        <div className="border-snake border-snake-left-2" />
        <div className="border-snake border-snake-right-1" />
        <div className="border-snake border-snake-right-2" />
      </div>

      {/* Conteúdo — aparece depois da energia */}
      <div
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center px-10 transition-opacity duration-700 ${
          pulsing || isEntering ? "opacity-0" : "opacity-100"
        }`}
      >
        {mode === "login" ? (
          <LoginForm onGoToRegister={() => onSwitch("register")} />
        ) : (
          <RegisterForm onGoToLogin={() => onSwitch("login")} />
        )}
      </div>

    </div>
  );
}