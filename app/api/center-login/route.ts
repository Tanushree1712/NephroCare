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

function mapLoginErrorMessage(message: string) {
  if (/email not confirmed/i.test(message)) {
    return "This staff account exists, but the email has not been confirmed yet.";
  }

  return message || "Invalid credentials.";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      centerCode?: string;
      password?: string;
    };
    const email = cleanText(body.email).toLowerCase();
    const centerCode = cleanText(body.centerCode).toUpperCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !centerCode || !password) {
      return NextResponse.json(
        { error: "Work email, center code, and password are required." },
        { status: 400 }
      );
    }

    const localUser = await prisma.user.findUnique({
      where: { email },
      include: {
        center: {
          select: {
            id: true,
            name: true,
            centerCode: true,
          },
        },
      },
    });

    if (
      !localUser ||
      localUser.role === "PATIENT" ||
      !localUser.centerId ||
      !localUser.center ||
      localUser.center.centerCode.toUpperCase() !== centerCode
    ) {
      return NextResponse.json(
        { error: "This account is not enabled for center access." },
        { status: 403 }
      );
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
      { error: "We could not sign you in to the center portal right now." },
      { status: 500 }
    );
  }
}
