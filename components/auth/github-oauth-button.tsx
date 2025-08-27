"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "../ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import Image from "next/image";

export default function GithubSignInButton(props: { nextUrl?: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        },
      });
    } catch (e) {
      console.log(e);
      toast.error("An error occured, please try google");
    } finally {
      setLoading(false);
    }
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
          src="/assets/github.png"
          alt="GitHub"
          width={16}
          height={16}
          className="size-4 dark:invert"
        />
      )}
      Continue with GitHub
    </Button>
  );
}
