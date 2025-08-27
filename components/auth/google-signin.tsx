"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "../ui/button";
import Image from "next/image";
import { useState } from "react";
import { Loader, LoaderCircle } from "lucide-react";

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
      className=" flex flex-row gap-2 w-48 items-center justify-center rounded-xl"
      onClick={handleLogin}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin text-muted-foreground dark:text-muted-foreground " />
      ) : (
        <Image src="/assets/google.png" alt="Google" width={16} height={16} />
      )}
      Continue with Google
    </Button>
  );
}
