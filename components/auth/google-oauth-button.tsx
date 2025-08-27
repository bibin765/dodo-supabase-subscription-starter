"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "../ui/button";
import Image from "next/image";

export default function GoogleSignInButton() {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });
  };

  return (
    <Button
      variant="outline"
      className="w-full flex flex-row gap-2 items-center justify-center rounded-xl"
      onClick={handleLogin}
    >
      <Image
        src="/assets/google.png"
        alt="Google"
        width={16}
        height={16}
        className="size-4"
      />
      Continue with Google
    </Button>
  );
}
