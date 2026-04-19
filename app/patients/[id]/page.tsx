import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/current-user";
import { PatientProfilePage } from "@/components/patient-profile-page";
import { getCenterScopeId, getUserPortalKind } from "@/lib/user-access";

export default async function PatientProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patientId = Number(id);
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.patientId && currentUser.patientId !== patientId) {
    redirect(`/patients/${currentUser.patientId}`);
  }

  const portalKind = getUserPortalKind(currentUser);
  const centerScopeId = getCenterScopeId(currentUser);

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      ...(centerScopeId ? { centerId: centerScopeId } : {}),
    },
    include: {
      center: {
        include: {
          city: true,
        },
      },
      appointments: {
        where: {
          status: "scheduled",
          date: {
            gte: new Date(),
          },
        },
        orderBy: {
          date: "asc",
        },
        take: 3,
        include: {
          center: true,
          machine: true,
        },
      },
      files: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
      sessions: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          appointment: {
            include: {
              center: true,
            },
          },
        },
      },
    },
  });

  if (!patient) {
    if (centerScopeId) {
      redirect("/patients");
    }

    notFound();
  }

  const centers = await prisma.center.findMany({
    where: centerScopeId ? { id: centerScopeId } : undefined,
    include: {
      city: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  return (
    <PatientProfilePage
      patient={{
        ...patient,
        createdAt: patient.createdAt.toISOString(),
        dialysisSince: patient.dialysisSince?.toISOString() ?? null,
        appointments: patient.appointments.map((appointment) => ({
          id: appointment.id,
          date: appointment.date.toISOString(),
          status: appointment.status,
          slot: appointment.slot as "MORNING" | "AFTERNOON" | "EVENING",
          machine: appointment.machine
            ? {
                code: appointment.machine.code,
              }
            : null,
          center: {
            name: appointment.center.name,
          },
        })),
        files: patient.files.map((file) => ({
          ...file,
          uploadedAt: file.uploadedAt.toISOString(),
        })),
        sessions: patient.sessions.map((session) => ({
          ...session,
          createdAt: session.createdAt.toISOString(),
        })),
      }}
      centers={centers}
      viewerPortalKind={portalKind === "center" ? "center" : portalKind === "operations" ? "operations" : "patient"}
    />
  );
}
