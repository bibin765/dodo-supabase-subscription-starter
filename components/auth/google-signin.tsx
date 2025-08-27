"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "../ui/button";
import Image from "next/image";
import { useState } from "react";
import { Loader } from "lucide-react";

export default function GoogleSignIn() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",

      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  return (
    <Button
      variant="outline"
      className=" flex flex-row gap-2 items-center justify-center rounded-xl"
      onClick={handleLogin}
    >
      {loading ? (
        <Loader className="size-4 animate-spin" />
      ) : (
        <Image src="/assets/google.png" alt="Google" width={16} height={16} />
      )}
      Continue with Google
    </Button>
  );
}
