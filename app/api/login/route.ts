import {
  DEV_SESSION_COOKIE,
  devSessionCookieOptions,
} from "@/lib/dev-session";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function looksLikeEmail(identifier: string) {
  return identifier.includes("@");
}

function mapLoginErrorMessage(message: string) {
  if (/email not confirmed/i.test(message)) {
    return "Your account exists, but the email has not been confirmed yet. Try registering again from this app or ask me to confirm this test user.";
  }

  return message || "Invalid credentials.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      password?: string;
    };
    const identifier = cleanText(body.identifier);
    const password = typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Name or email and password are required." },
        { status: 400 }
      );
    }

    let email = identifier.toLowerCase();

    if (!looksLikeEmail(identifier)) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          name: {
            equals: identifier,
            mode: "insensitive",
          },
        },
        select: {
          email: true,
        },
        take: 2,
      });

      if (matchingUsers.length === 0) {
        return NextResponse.json(
          { error: "Invalid credentials." },
          { status: 401 }
        );
      }

      if (matchingUsers.length > 1) {
        return NextResponse.json(
          {
            error:
              "Multiple accounts match this name. Please sign in with your email instead.",
          },
          { status: 409 }
        );
      }

      email = matchingUsers[0].email.toLowerCase();
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: mapLoginErrorMessage(error.message) },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      redirectTo: "/",
    });

    response.cookies.set({
      name: DEV_SESSION_COOKIE,
      value: "",
      ...devSessionCookieOptions,
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "We could not sign you in right now." },
      { status: 500 }
    );
  }
}
