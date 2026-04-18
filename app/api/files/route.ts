import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const patientId = formData.get("patientId") as string | null;

    if (!file || !patientId) {
      return NextResponse.json({ error: "File and patientId are required" }, { status: 400 });
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
        patientId: Number(patientId),
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
