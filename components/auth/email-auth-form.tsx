"use client";
import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function EmailAuthForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/confirm`,
        },
      });

      console.log(data, error);

      toast.success("Magic link sent to your email");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={handleSendOTP}>
      <Input
        type="email"
        name="email"
        placeholder="ligma@jhonson.com"
        value={email}
        id="email"
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        className="w-full rounded-xl font-medium"
      />
      <Button className="w-full rounded-xl">
        {loading ? (
          <Loader className="text-muted/60 size-4 animate-spin" />
        ) : (
          "Continue with Email"
        )}
      </Button>
    </form>
  );
}
