"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "../ui/button";
import { useState } from "react";

import { Loader } from "lucide-react";
import Image from "next/image";

export default function GoogleSignInButton() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/api/auth/callback`,
      },
    });
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      className="w-full flex flex-row gap-2 items-center justify-center rounded-xl"
      onClick={handleLogin}
    >
      {loading ? (
        <Loader className="size-4 animate-spin" />
      ) : (
        <Image
          src="/assets/google.png"
          alt="Google"
          width={16}
          height={16}
          className="size-4"
        />
      )}
      Continue with Google
    </Button>
  );
}
