CREATE TABLE "Machine" (
    "id" SERIAL NOT NULL,
    "centerId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffMember" (
    "id" SERIAL NOT NULL,
    "centerId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "specialization" TEXT,
    "phone" TEXT,
    "shiftLabel" TEXT NOT NULL,
    "availableSlots" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "capacityPerSlot" INTEGER NOT NULL DEFAULT 1,
    "isAvailableToday" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Appointment"
ADD COLUMN "slot" TEXT NOT NULL DEFAULT 'MORNING',
ADD COLUMN "machineId" INTEGER;

UPDATE "Appointment"
SET "slot" = CASE
    WHEN EXTRACT(HOUR FROM ("date" + INTERVAL '5 hours 30 minutes')) < 12 THEN 'MORNING'
    WHEN EXTRACT(HOUR FROM ("date" + INTERVAL '5 hours 30 minutes')) < 16 THEN 'AFTERNOON'
    ELSE 'EVENING'
END;

CREATE UNIQUE INDEX "Machine_centerId_code_key" ON "Machine"("centerId", "code");
CREATE INDEX "Machine_centerId_isActive_status_idx" ON "Machine"("centerId", "isActive", "status");
CREATE UNIQUE INDEX "StaffMember_centerId_code_key" ON "StaffMember"("centerId", "code");
CREATE INDEX "StaffMember_centerId_isActive_isAvailableToday_idx" ON "StaffMember"("centerId", "isActive", "isAvailableToday");
CREATE INDEX "Appointment_centerId_date_slot_status_idx" ON "Appointment"("centerId", "date", "slot", "status");
CREATE INDEX "Appointment_patientId_date_slot_status_idx" ON "Appointment"("patientId", "date", "slot", "status");

ALTER TABLE "Machine"
ADD CONSTRAINT "Machine_centerId_fkey"
FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffMember"
ADD CONSTRAINT "StaffMember_centerId_fkey"
FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_machineId_fkey"
FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
