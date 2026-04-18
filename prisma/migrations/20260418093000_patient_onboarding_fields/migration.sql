ALTER TABLE "Patient"
ADD COLUMN "location" TEXT,
ADD COLUMN "primaryDiagnosis" TEXT,
ADD COLUMN "dialysisType" TEXT,
ADD COLUMN "dialysisFrequency" TEXT,
ADD COLUMN "vascularAccess" TEXT,
ADD COLUMN "dialysisSince" TIMESTAMP(3),
ADD COLUMN "preferredSlot" TEXT,
ADD COLUMN "allergies" TEXT,
ADD COLUMN "comorbidities" TEXT,
ADD COLUMN "medicalHistory" TEXT,
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT;
