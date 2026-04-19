import { DEV_SESSION_COOKIE } from "@/lib/dev-session";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const redirectToValue = formData?.get("redirectTo");
  const redirectTo =
    typeof redirectToValue === "string" && redirectToValue.startsWith("/")
      ? redirectToValue
      : "/login";

  const supabase = await createClient();

  // Check if a user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url), {
    status: 302,
  });

  response.cookies.set({
    name: DEV_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
