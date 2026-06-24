"use client";

import { useState } from "react";
import ClosedBook from "./ClosedBook";
import OpenBook from "./OpenBook";

type BookState = "closed" | "opening" | "login" | "register";

export default function AuthBook() {
  const [state, setState] = useState<BookState>("closed");
  const [pulsing, setPulsing] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  function handleOpen() {
    if (state !== "closed") return;
    setState("opening");
    setTimeout(() => {
      setState("login");
      setIsEntering(true);       // energia entra primeiro
      setTimeout(() => {
        setIsEntering(false);    // livro e conteúdo revelam
      }, 800);
    }, 1200);
  }

  function handleSwitch(to: "login" | "register") {
    if (pulsing) return;
    setPulsing(true);
    setTimeout(() => {
      setState(to);
      setPulsing(false);
    }, 600);
  }

  return (
    <div
      onClick={state === "closed" ? handleOpen : undefined}
      className={`relative transition-all duration-700 ${
        state === "closed" || state === "opening"
          ? "cursor-pointer"
          : "cursor-default"
      }`}
    >
      {state === "closed" || state === "opening" ? (
        <ClosedBook activating={state === "opening"} />
      ) : (
        <OpenBook
          mode={state}
          pulsing={pulsing}
          onSwitch={handleSwitch}
          isEntering={isEntering}
        />
      )}
    </div>
  );
}