"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleX, LoaderCircle, Save } from "lucide-react";
import { getCenterLabel, type CenterOption } from "@/lib/patient-utils";

type EditablePatient = {
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
  center: {
    id: number;
  };
};

type PatientProfileEditorProps = {
  patient: EditablePatient;
  centers: CenterOption[];
  open: boolean;
  onClose: () => void;
};

type EditorFormState = {
  name: string;
  age: string;
  gender: string;
  phone: string;
  bloodGroup: string;
  location: string;
  centerId: string;
  primaryDiagnosis: string;
  dialysisType: string;
  dialysisFrequency: string;
  vascularAccess: string;
  dialysisSince: string;
  preferredSlot: string;
  allergies: string;
  comorbidities: string;
  medicalHistory: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

const inputClasses =
  "w-full rounded-[18px] border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100";

const textAreaClasses = `${inputClasses} min-h-28 resize-none`;

function getInitialFormState(patient: EditablePatient): EditorFormState {
  return {
    name: patient.name,
    age: String(patient.age),
    gender: patient.gender,
    phone: patient.phone,
    bloodGroup: patient.bloodGroup ?? "",
    location: patient.location ?? "",
    centerId: String(patient.center.id),
    primaryDiagnosis: patient.primaryDiagnosis ?? "",
    dialysisType: patient.dialysisType ?? "",
    dialysisFrequency: patient.dialysisFrequency ?? "",
    vascularAccess: patient.vascularAccess ?? "",
    dialysisSince: patient.dialysisSince ? patient.dialysisSince.slice(0, 10) : "",
    preferredSlot: patient.preferredSlot ?? "",
    allergies: patient.allergies ?? "",
    comorbidities: patient.comorbidities ?? "",
    medicalHistory: patient.medicalHistory ?? "",
    emergencyContactName: patient.emergencyContactName ?? "",
    emergencyContactPhone: patient.emergencyContactPhone ?? "",
  };
}

export function PatientProfileEditor({
  patient,
  centers,
  open,
  onClose,
}: PatientProfileEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<EditorFormState>(() => getInitialFormState(patient));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setError("");
    }

    setForm(getInitialFormState(patient));
  }, [open, patient]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          centerId: Number(form.centerId),
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to update patient profile.");
      }

      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update patient profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 px-3 py-3 backdrop-blur-sm md:px-6 md:py-6">
      <div className="flex h-full w-full max-w-[780px] flex-col overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(17,124,136,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 md:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Edit profile
            </p>
            <h2 className="mt-2 font-display text-[2rem] leading-none text-slate-900">
              Update care details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          >
            <CircleX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6 md:px-7">
            {error ? (
              <div className="rounded-[20px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Full name
                </label>
                <input
                  className={inputClasses}
                  value={form.name}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, name: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Phone
                </label>
                <input
                  className={inputClasses}
                  value={form.phone}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, phone: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className={inputClasses}
                  value={form.age}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, age: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Gender
                </label>
                <select
                  className={inputClasses}
                  value={form.gender}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, gender: event.target.value }))
                  }
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Blood group
                </label>
                <input
                  className={inputClasses}
                  value={form.bloodGroup}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      bloodGroup: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Registered location
                </label>
                <input
                  className={inputClasses}
                  value={form.location}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, location: event.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Preferred center
                </label>
                <select
                  className={inputClasses}
                  value={form.centerId}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, centerId: event.target.value }))
                  }
                >
                  {centers.map((center) => (
                    <option key={center.id} value={center.id}>
                      {getCenterLabel(center)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Primary diagnosis
                </label>
                <input
                  className={inputClasses}
                  value={form.primaryDiagnosis}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      primaryDiagnosis: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Dialysis type
                </label>
                <select
                  className={inputClasses}
                  value={form.dialysisType}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      dialysisType: event.target.value,
                    }))
                  }
                >
                  <option value="">Select</option>
                  <option value="Hemodialysis">Hemodialysis</option>
                  <option value="Peritoneal dialysis">Peritoneal dialysis</option>
                  <option value="Planning consultation">Planning consultation</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Dialysis frequency
                </label>
                <select
                  className={inputClasses}
                  value={form.dialysisFrequency}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      dialysisFrequency: event.target.value,
                    }))
                  }
                >
                  <option value="">Select</option>
                  <option value="Twice weekly">Twice weekly</option>
                  <option value="Thrice weekly">Thrice weekly</option>
                  <option value="As advised">As advised</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Vascular access
                </label>
                <select
                  className={inputClasses}
                  value={form.vascularAccess}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      vascularAccess: event.target.value,
                    }))
                  }
                >
                  <option value="">Select</option>
                  <option value="AV fistula">AV fistula</option>
                  <option value="Catheter">Catheter</option>
                  <option value="Graft">Graft</option>
                  <option value="To be assessed">To be assessed</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Dialysis since
                </label>
                <input
                  type="date"
                  className={inputClasses}
                  value={form.dialysisSince}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      dialysisSince: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Preferred slot
                </label>
                <select
                  className={inputClasses}
                  value={form.preferredSlot}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      preferredSlot: event.target.value,
                    }))
                  }
                >
                  <option value="">Select</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Allergies
                </label>
                <textarea
                  className={textAreaClasses}
                  value={form.allergies}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, allergies: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Comorbidities
                </label>
                <textarea
                  className={textAreaClasses}
                  value={form.comorbidities}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      comorbidities: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Medical history
                </label>
                <textarea
                  className={textAreaClasses}
                  value={form.medicalHistory}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      medicalHistory: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Emergency contact name
                </label>
                <input
                  className={inputClasses}
                  value={form.emergencyContactName}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      emergencyContactName: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Emergency contact phone
                </label>
                <input
                  className={inputClasses}
                  value={form.emergencyContactPhone}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      emergencyContactPhone: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5 md:px-7">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isPending}
              className="inline-flex items-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#17bfd3_0%,#0e9a9d_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(20,190,211,0.22)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving || isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
