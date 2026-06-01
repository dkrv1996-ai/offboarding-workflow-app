import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/Layout/AppShell";
import { createRequest } from "../api/createRequest";

import {
  Paper,
  Stack,
  Grid,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  MenuItem,
} from "@mui/material";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";

import { countries } from "countries-list";

type FormState = {
  employeeName: string;
  employeeId: string;
  department: string;
  jobTitle: string;

  country: string;
  city: string;

  lastWorkingDay: string; // yyyy-mm-dd
  reasonForExit: string;

  managerEmail: string;
  financeEmail: string;
  itEmail: string;
  adminEmail: string;
  finalHrEmail: string;

  companyAssets: string;
  hrComments: string;
};

export default function NewRequestPage() {
  const nav = useNavigate();

  const countryOptions = useMemo(() => {
    const names = Object.values(countries).map((c) => c.name);
    names.sort((a, b) => a.localeCompare(b));
    return names;
  }, []);

  const [form, setForm] = useState<FormState>({
    employeeName: "",
    employeeId: "",
    department: "",
    jobTitle: "",

    country: "",
    city: "",

    lastWorkingDay: "",
    reasonForExit: "",

    managerEmail: "",
    financeEmail: "",
    itEmail: "",
    adminEmail: "",
    finalHrEmail: "",

    companyAssets: "",
    hrComments: "",
  });

  // Calendar state uses Dayjs
  const [lwd, setLwd] = useState<Dayjs | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [success, setSuccess] = useState<null | {
    requestId: string;
    approvalLink: string;
    currentStep: string;
  }>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const requiredKeys: Array<keyof FormState> = [
    "employeeName",
    "employeeId",
    "department",
    "jobTitle",
    "country",
    "city",
    "lastWorkingDay",
    "reasonForExit",
    "managerEmail",
    "financeEmail",
    "itEmail",
    "adminEmail",
    "finalHrEmail",
  ];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const missing = requiredKeys.filter((k) => !String(form[k]).trim());
    if (missing.length) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const resp = await createRequest({
        employeeName: form.employeeName.trim(),
        employeeId: form.employeeId.trim(),
        department: form.department.trim(),
        jobTitle: form.jobTitle.trim(),

        country: form.country.trim(),
        city: form.city.trim(),

        lastWorkingDay: form.lastWorkingDay,
        reasonForExit: form.reasonForExit.trim(),

        managerEmail: form.managerEmail.trim(),
        financeEmail: form.financeEmail.trim(),
        itEmail: form.itEmail.trim(),
        adminEmail: form.adminEmail.trim(),
        finalHrEmail: form.finalHrEmail.trim(),

        companyAssets: form.companyAssets.trim() || undefined,
        hrComments: form.hrComments.trim() || undefined,
      });

      setSuccess({
        requestId: resp.requestId,
        approvalLink: resp.approvalLink,
        currentStep: resp.currentStep,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AppShell title="Create Offboarding Request">
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={900}>
            Request Created ✅
          </Typography>
          <Typography sx={{ mt: 1 }}>
            <b>Request ID:</b> {success.requestId}
          </Typography>
          <Typography>
            <b>Current Step:</b> {success.currentStep}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography fontWeight={800}>Manager Token Link (testing)</Typography>
          <Typography sx={{ wordBreak: "break-all", mt: 1 }}>{success.approvalLink}</Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={() => window.open(success.approvalLink, "_blank")}>
              Open Approval Link
            </Button>
            <Button variant="outlined" onClick={() => nav(`/requests/${success.requestId}`)}>
              View Details
            </Button>
            <Button onClick={() => nav("/dashboard")}>Back to Dashboard</Button>
          </Stack>
        </Paper>
      </AppShell>
    );
  }

  return (
    <AppShell title="Create Offboarding Request">
      <form onSubmit={onSubmit}>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={900}>
              Employee Details
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Employee Name *" value={form.employeeName} onChange={(e) => set("employeeName", e.target.value)} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Employee ID *" value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Department *" value={form.department} onChange={(e) => set("department", e.target.value)} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Job Title *" value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Country *"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                >
                  {countryOptions.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="City *" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Last Working Day *"
                  value={lwd}
                  onChange={(val) => {
                    setLwd(val);
                    set("lastWorkingDay", val ? val.format("YYYY-MM-DD") : "");
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Reason for Exit *" value={form.reasonForExit} onChange={(e) => set("reasonForExit", e.target.value)} />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={900}>
              Approver Emails
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Line Manager Email *" value={form.managerEmail} onChange={(e) => set("managerEmail", e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Finance Approver Email *" value={form.financeEmail} onChange={(e) => set("financeEmail", e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="IT Approver Email *" value={form.itEmail} onChange={(e) => set("itEmail", e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Admin Approver Email *" value={form.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Final HR Email (record) *" value={form.finalHrEmail} onChange={(e) => set("finalHrEmail", e.target.value)} />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={900}>
              Optional
            </Typography>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Company Assets" value={form.companyAssets} onChange={(e) => set("companyAssets", e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="HR Comments" multiline minRows={3} value={form.hrComments} onChange={(e) => set("hrComments", e.target.value)} />
              </Grid>
            </Grid>
          </Paper>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
            <Button variant="outlined" onClick={() => nav("/dashboard")}>Cancel</Button>
          </Stack>
        </Stack>
      </form>
    </AppShell>
  );
}