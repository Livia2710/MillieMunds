import Image from "next/image";
import type { ButtonHTMLAttributes } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
}

export function PrimaryButton({ children, className = "", ...props }: PrimaryButtonProps) {
    return (
        <button type="button" 
        className={`arcane-hover relative h-14 w-full max-w-80 overflow-hidden border border-bege-escuro/30 px-4 font-title text-base uppercase tracking-[0.16em] text-bege-escuro shadow-header transition sm:h-16 sm:text-2xl sm:tracking-[0.22em] ${className}`}
        {...props}>
        
        <Image
        src="/assets/svgs/corner-left-top.svg"
        alt=""
        width={80}
        height={80}
        className="pointer-events-none absolute left-0 top-0 h-full w-auto opacity-60"
        />
        <span className="relative z-10">{children}</span>

        <Image
        src="/assets/svgs/corner-right-bottom.svg"
        alt=""
        width={80}
        height={80}
        className="pointer-events-none absolute right-0 bottom-0 h-full w-auto opacity-60"
        />
        
        </button>
    )
}
