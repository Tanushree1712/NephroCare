import { getCurrentAppUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getCenterScopeId, isPatientPortalUser } from "@/lib/user-access";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentAppUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const patientId = formData.get("patientId") as string | null;

    if (!file || !patientId) {
      return NextResponse.json({ error: "File and patientId are required" }, { status: 400 });
    }

    const patientIdNumber = Number(patientId);

    if (!Number.isInteger(patientIdNumber) || patientIdNumber < 1) {
      return NextResponse.json({ error: "A valid patientId is required" }, { status: 400 });
    }

    if (isPatientPortalUser(currentUser) && currentUser.patientId !== patientIdNumber) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const centerScopeId = getCenterScopeId(currentUser);

    if (centerScopeId) {
      const patient = await prisma.patient.findFirst({
        where: {
          id: patientIdNumber,
          centerId: centerScopeId,
        },
        select: { id: true },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "You can only upload files for your assigned center." },
          { status: 403 }
        );
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${patientId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('medical-records')
      .upload(fileName, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('medical-records')
      .getPublicUrl(fileName);

    const dbFile = await prisma.file.create({
      data: {
        patientId: patientIdNumber,
        fileUrl: publicUrlData.publicUrl,
        fileType: file.type || "application/octet-stream",
      },
    });

    return NextResponse.json(dbFile);
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
