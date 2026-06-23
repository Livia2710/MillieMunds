import Image from "next/image";
import LoginForm from "./LoginForm";

export default function OpenBook() {
  return (
    <div className="animate-in fade-in relative h-[68vh] w-95 md:h-[76vh] md:w-[28vw]  duration-700">
      <Image
        src="/assets/svgs/moldura.svg"
        fill
        alt="Moldura decorativa"
        className="absolute"
      />

      <div className="relative z-10 p-12">
        <LoginForm />
      </div>
    </div>
  );
}
