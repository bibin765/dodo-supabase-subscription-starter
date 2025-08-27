import Image from "next/image";
import React from "react";
import { Separator } from "../ui/separator";

export default function Header() {
  return (
    <div className="text-center">
      <div className="flex flex-row my-4  items-center h-8 justify-center gap-4 ">
        <Image
          src="/assets/dodo.svg"
          alt="Dodo Payments"
          width={32}
          height={32}
        />
        <Separator orientation="vertical" />

        <Image
          src="/assets/supabase.svg"
          alt="Supabase"
          width={32}
          height={32}
        />
      </div>
      <h2 className="text-xl font-display md:text-2xl font-medium text-primary">
        Dodo Supabase subscription starter
      </h2>
      <p className="text-sm mt-2 text-muted-foreground max-w-xl mx-auto tracking-tight">
        A Minimal Next.js + Supabase + Dodo Payments subscription starter kit.
      </p>
    </div>
  );
}
