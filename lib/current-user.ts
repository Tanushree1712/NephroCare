import { prisma } from "@/lib/prisma";
import {
  DEV_SESSION_COOKIE,
  isDevLoginEnabled,
  readDevSessionValue,
} from "@/lib/dev-session";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export type CurrentAppUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  patientId: number | null;
  centerId: number | null;
};

function mapCurrentAppUser(localUser: {
  id: number;
  name: string;
  email: string;
  role: string;
  patientId: number | null;
  centerId: number | null;
}): CurrentAppUser {
  return {
    id: localUser.id,
    name: localUser.name,
    email: localUser.email,
    role: localUser.role,
    patientId: localUser.patientId,
    centerId: localUser.centerId,
  };
}

export async function getCurrentAuthUser(): Promise<SupabaseUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  if (isDevLoginEnabled()) {
    const cookieStore = await cookies();
    const devSession = readDevSessionValue(
      cookieStore.get(DEV_SESSION_COOKIE)?.value
    );

    if (devSession?.userId) {
      const localUser = await prisma.user.findUnique({
        where: { id: devSession.userId },
      });

      if (localUser) {
        return mapCurrentAppUser(localUser);
      }
    }
  }

  const user = await getCurrentAuthUser();

  if (!user) {
    return null;
  }

  const localUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  if (!localUser) {
    return null;
  }

  return mapCurrentAppUser(localUser);
}
