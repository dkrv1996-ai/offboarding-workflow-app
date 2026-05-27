-- CreateTable
CREATE TABLE "OffboardingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeName" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "lastWorkingDay" TEXT NOT NULL,
    "reasonForExit" TEXT NOT NULL,
    "managerEmail" TEXT NOT NULL,
    "financeEmail" TEXT NOT NULL,
    "itEmail" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "finalHrEmail" TEXT NOT NULL,
    "companyAssets" TEXT,
    "hrComments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "currentStep" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "approverEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "dataJson" TEXT,
    "actedAt" DATETIME,
    CONSTRAINT "Approval_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OffboardingRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalToken" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalToken_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OffboardingRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "who" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OffboardingRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Approval_requestId_step_key" ON "Approval"("requestId", "step");
