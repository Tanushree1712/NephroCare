"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  Droplets,
  FileText,
  HeartPulse,
  MapPin,
  Phone,
  Printer,
  ShieldAlert,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { formatPatientId } from "@/lib/patient-utils";
import { PatientProfileEditor } from "@/components/patient-profile-editor";
import type { CenterOption } from "@/lib/patient-utils";

type PatientProfileData = {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  bloodGroup: string | null;
  location: string | null;
  primaryDiagnosis: string | null;
  dialysisType: string | null;
  dialysisFrequency: string | null;
  vascularAccess: string | null;
  dialysisSince: string | null;
  preferredSlot: string | null;
  allergies: string | null;
  comorbidities: string | null;
  medicalHistory: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  center: {
    id: number;
    name: string;
    address: string | null;
    centerCode: string;
    city: {
      name: string;
    };
  };
  files: Array<{
    id: number;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
  }>;
  appointments: Array<{
    id: number;
    date: string;
    status: string;
    center: {
      name: string;
    };
  }>;
  sessions: Array<{
    id: number;
    createdAt: string;
    weightBefore: number | null;
    weightAfter: number | null;
    bp: string | null;
    notes: string | null;
    appointment: {
      center: {
        name: string;
      } | null;
    } | null;
  }>;
};

type PatientProfilePageProps = {
  patient: PatientProfileData;
  centers: CenterOption[];
  viewerPortalKind: "patient" | "center" | "operations";
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PatientProfilePage({
  patient,
  centers,
  viewerPortalKind,
}: PatientProfilePageProps) {
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const patientCode = formatPatientId(
    patient.id,
    patient.center.centerCode,
    patient.createdAt
  );
  const initials = patient.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const nextAppointment = patient.appointments.find(
    (appointment) => appointment.status === "scheduled"
  );
  const primaryCtaHref = viewerPortalKind === "patient" ? "/book" : "/appointments";
  const primaryCtaLabel =
    viewerPortalKind === "patient" ? "Book next session" : "Open bookings";

  async function generatePDF() {
    if (!profileRef.current) {
      return;
    }

    try {
      const canvas = await html2canvas(profileRef.current, { scale: 2 });
      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Patient_${patient.name.replace(/\s+/g, "_")}_Profile.pdf`);
    } catch {
      window.alert("We could not generate the PDF right now.");
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", String(patient.id));

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      router.refresh();
    } catch {
      window.alert("We could not upload the document.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6" ref={profileRef}>
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/82 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0b3d46_0%,#0f98a2_48%,#17bfd3_100%)] px-6 py-7 text-white shadow-[0_24px_80px_rgba(10,120,132,0.22)] md:px-8 md:py-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-white/16 text-2xl font-bold">
                {initials}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100/72">
                  Patient profile
                </p>
                <h1 className="mt-2 font-display text-[2.8rem] leading-[0.95]">
                  {patient.name}
                </h1>
                <p className="mt-2 text-sm text-cyan-50/88">Patient ID {patientCode}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                patient.primaryDiagnosis || "Diagnosis pending",
                patient.location || patient.center.city.name,
                patient.dialysisFrequency || "Dialysis plan not set",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/16 bg-white/12 px-4 py-2 text-sm font-semibold text-white"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center gap-2 rounded-[18px] bg-white px-5 py-3 text-sm font-semibold !text-black transition-transform hover:-translate-y-0.5"
              >
                {primaryCtaLabel}
              </Link>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-[18px] border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/16"
              >
                Edit profile
              </button>
              <button
                onClick={generatePDF}
                className="inline-flex items-center gap-2 rounded-[18px] border border-white/18 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/16"
              >
                <Printer className="h-4 w-4" />
                Print summary
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/14 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/16">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/74">
                  Next session
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {nextAppointment ? formatDateTime(nextAppointment.date) : "Not booked yet"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] bg-white/12 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  Assigned center
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{patient.center.name}</p>
                <p className="mt-1 text-sm text-cyan-50/84">
                  {patient.center.address || patient.center.city.name}
                </p>
              </div>
              <div className="rounded-[22px] bg-white/12 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/72">
                  Preferred slot
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {patient.preferredSlot || "Morning"}
                </p>
                <p className="mt-1 text-sm text-cyan-50/84">
                  {patient.dialysisType || "Dialysis type not recorded"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Personal details
              </p>
              <h2 className="mt-1 font-display text-[2rem] leading-none text-slate-900">
                Contact and center
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { label: "Age", value: `${patient.age} years`, icon: CalendarDays },
              { label: "Gender", value: patient.gender, icon: UserRound },
              { label: "Phone", value: patient.phone, icon: Phone },
              {
                label: "Location",
                value: patient.location || patient.center.city.name,
                icon: MapPin,
              },
              {
                label: "Center",
                value: patient.center.name,
                icon: Building2,
              },
              {
                label: "Emergency contact",
                value: patient.emergencyContactName || "Not added",
                icon: ShieldAlert,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="rounded-[24px] bg-slate-50 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white text-cyan-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base font-semibold capitalize text-slate-900">
                    {item.value}
                  </p>
                  {item.label === "Emergency contact" && patient.emergencyContactPhone ? (
                    <p className="mt-1 text-sm text-slate-500">{patient.emergencyContactPhone}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Care plan
              </p>
              <h2 className="mt-1 font-display text-[2rem] leading-none text-slate-900">
                Dialysis essentials
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { label: "Blood group", value: patient.bloodGroup || "Not recorded", icon: Droplets },
              {
                label: "Dialysis type",
                value: patient.dialysisType || "Not recorded",
                icon: Activity,
              },
              {
                label: "Frequency",
                value: patient.dialysisFrequency || "Not recorded",
                icon: CalendarDays,
              },
              {
                label: "Vascular access",
                value: patient.vascularAccess || "Not recorded",
                icon: ShieldAlert,
              },
              {
                label: "Dialysis since",
                value: patient.dialysisSince ? formatDate(patient.dialysisSince) : "Not recorded",
                icon: Clock3,
              },
              {
                label: "Preferred slot",
                value: patient.preferredSlot || "Morning",
                icon: Clock3,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="rounded-[24px] bg-slate-50 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white text-cyan-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{item.value}</p>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Clinical history
              </p>
              <h2 className="mt-1 font-display text-[2rem] leading-none text-slate-900">
                Medical notes
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Primary diagnosis
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {patient.primaryDiagnosis || "Not recorded"}
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Allergies
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {patient.allergies || "No allergies recorded"}
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Comorbidities
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {patient.comorbidities || "No additional conditions recorded"}
              </p>
            </div>
            <div className="rounded-[24px] border border-dashed border-cyan-100 bg-cyan-50/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                Additional history
              </p>
              <p className="mt-2 text-sm leading-7 text-cyan-900/82">
                {patient.medicalHistory ||
                  "Add clinical notes, medications, previous admissions, and transplant details during registration or future profile edits."}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Documents
              </p>
              <h2 className="mt-1 font-display text-[2rem] leading-none text-slate-900">
                Medical artifacts
              </h2>
            </div>
          </div>

          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center transition-colors hover:border-cyan-200 hover:bg-cyan-50/70">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <UploadCloud className="h-8 w-8 text-cyan-600" />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {uploading ? "Uploading document..." : "Upload prescriptions, reports, or lab files"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              The file will attach directly to this patient ID.
            </p>
          </label>

          <div className="mt-5 space-y-3">
            {patient.files.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                No files uploaded yet.
              </div>
            ) : (
              patient.files.map((file) => (
                <a
                  key={file.id}
                  href={file.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-4 transition-colors hover:bg-cyan-50/70"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Document #{file.id}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {file.fileType} uploaded on {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-cyan-700">Open</span>
                </a>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[32px] border border-white/80 bg-white/82 p-6 shadow-[0_24px_80px_rgba(17,124,136,0.08)] backdrop-blur-xl md:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-cyan-50 text-cyan-700">
            <Clock3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Treatment history
            </p>
            <h2 className="mt-1 font-display text-[2rem] leading-none text-slate-900">
              Session timeline
            </h2>
          </div>
        </div>

        <div className="mt-8 space-y-6 border-l-2 border-cyan-100 pl-6">
          {patient.sessions.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 px-5 py-6 text-sm text-slate-500">
              No dialysis sessions have been recorded yet.
            </div>
          ) : (
            patient.sessions.map((session) => (
              <div key={session.id} className="relative">
                <div className="absolute -left-[33px] top-1 h-4 w-4 rounded-full bg-cyan-500 ring-4 ring-white" />
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {formatDate(session.createdAt)}
                </p>
                <div className="mt-3 rounded-[24px] bg-slate-50 p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-base font-semibold text-slate-900">
                      {session.appointment?.center?.name || "Dialysis session"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {session.bp ? `Blood pressure ${session.bp}` : "Vitals not recorded"}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-[18px] bg-white px-4 py-3 text-sm text-slate-600">
                      Weight before:{" "}
                      <span className="font-semibold text-slate-900">
                        {session.weightBefore ?? "N/A"} kg
                      </span>
                    </div>
                    <div className="rounded-[18px] bg-white px-4 py-3 text-sm text-slate-600">
                      Weight after:{" "}
                      <span className="font-semibold text-slate-900">
                        {session.weightAfter ?? "N/A"} kg
                      </span>
                    </div>
                  </div>
                  {session.notes ? (
                    <p className="mt-4 rounded-[18px] bg-white px-4 py-3 text-sm leading-7 text-slate-600">
                      {session.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <PatientProfileEditor
        patient={patient}
        centers={centers}
        open={isEditing}
        onClose={() => setIsEditing(false)}
      />
    </div>
  );
}
