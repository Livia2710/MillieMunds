import Image from "next/image";
import type { ButtonHTMLAttributes } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
}

export function PrimaryButton({ children, className = "", ...props }: PrimaryButtonProps) {
    return (
        <button type="button" 
        className={`arcane-hover relative h-16 w-80 overflow-hidden border border-bege-escuro/30 font-title text-2xl uppercase tracking-[0.22em] text-bege-escuro shadow-header transition ${className}`}
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