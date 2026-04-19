import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userInclude = {
      center: {
        include: {
          city: true,
        },
      },
      patient: {
        include: {
          center: {
            include: {
              city: true,
            },
          },
        },
      },
    } as const;

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: userInclude,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
