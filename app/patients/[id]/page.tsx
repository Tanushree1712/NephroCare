import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/current-user";
import { PatientProfilePage } from "@/components/patient-profile-page";

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

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
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
    notFound();
  }

  const centers = await prisma.center.findMany({
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
    />
  );
}
