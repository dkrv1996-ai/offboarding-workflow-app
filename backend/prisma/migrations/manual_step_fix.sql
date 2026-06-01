-- OffboardingRequest current step
UPDATE OffboardingRequest
SET currentStep = 'HR_FINAL'
WHERE currentStep = 'FINAL_HR';

-- Approval rows
UPDATE Approval
SET step = 'HR_FINAL'
WHERE step = 'FINAL_HR';

-- Approval tokens
UPDATE ApprovalToken
SET step = 'HR_FINAL'
WHERE step = 'FINAL_HR';

-- Audit log "who" text (optional but recommended for reporting/printing)
UPDATE AuditLog
SET who = 'HR_FINAL'
WHERE UPPER(who) = 'FINAL_HR';