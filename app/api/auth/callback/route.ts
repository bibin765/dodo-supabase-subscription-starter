import { createUser } from "@/actions/create-user";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      await createUser();
      return NextResponse.redirect(`${origin}/dashboard`);
    } else {
      return NextResponse.redirect(
        `${origin}/login?error=${error?.message || "Could not authenticate"}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Unknown error`);
}
