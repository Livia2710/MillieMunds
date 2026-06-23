"use client";

import { useState } from "react";
import ClosedBook from "./ClosedBook";
import OpenBook from "./OpenBook";

export default function AuthBook() {

  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => !open && setOpen(true)}
      className={` relative cursor-pointer transition-all duration-700
        ${open 
          ? "scale-100"
          : "hover:scale-105"
        }
      `}
    >

      {!open ? (
        <ClosedBook />
      ) : (
        <OpenBook />
      )}

    </div>
  );
}