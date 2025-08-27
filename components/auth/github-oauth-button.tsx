"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "../ui/button";
import { toast } from "sonner";
import Image from "next/image";

export default function GithubSignInButton(props: { nextUrl?: string }) {
  const supabase = createClient();

  const handleLogin = async () => {
    try {
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
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full flex flex-row gap-2 items-center justify-center rounded-xl"
      onClick={handleLogin}
    >
      <Image
        src="/assets/github.png"
        alt="GitHub"
        width={16}
        height={16}
        className="size-4 dark:invert"
      />
      Continue with GitHub
    </Button>
  );
}
