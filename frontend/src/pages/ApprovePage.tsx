import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  getApproveInfo,
  submitApproval,
  type ApproveInfoResponse,
  type Step as ApprovalStep,
} from "../api/publicApprove";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Stepper,
  Step as MuiStep,
  StepLabel,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material";

import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";

type SubmitResult =
  | { kind: "idle" }
  | { kind: "loading" }
  | {
      kind: "success";
      message: string;
      nextStep?: string;
      nextLink?: string;
      requestId?: string;
      finalStatus?: string;
    }
  | { kind: "error"; message: string };

const FLOW: ApprovalStep[] = ["MANAGER", "FINANCE", "IT", "ADMIN", "FINAL_HR"];

function stepIndex(step?: ApprovalStep) {
  if (!step) return 0;
  const idx = FLOW.indexOf(step);
  return idx >= 0 ? idx : 0;
}

function defaultDataFor(step: ApprovalStep) {
  switch (step) {
    case "FINANCE":
      return { pendingSalary: "", recovery: 0 };
    case "IT":
      return {
        laptopReturned: "No",
        emailDisabled: "No",
        vpnDisabled: "No",
        otherSystems: "",
      };
    case "ADMIN":
      return { idCardReturned: "No", parkingDisabled: "No", deskCleared: "No" };
    case "FINAL_HR":
      return { experienceLetter: "No", exitInterview: "No" };
    default:
      return {};
  }
}

export default function ApprovePage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<ApproveInfoResponse | null>(null);
  const [error, setError] = useState("");

  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [comments, setComments] = useState("");
  const [data, setData] = useState<Record<string, any>>({});
  const [submit, setSubmit] = useState<SubmitResult>({ kind: "idle" });

  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; text: string }>({
    open: false,
    text: "",
  });

  const step = info?.step as ApprovalStep | undefined;
  const activeStep = useMemo(() => stepIndex(step), [step]);

  useEffect(() => {
    const run = async () => {
      if (!token) return;

      setLoading(true);
      setError("");
      setSubmit({ kind: "idle" });

      try {
        const res = await getApproveInfo(token);
        setInfo(res);

        setAction("APPROVE");
        setComments("");
        setData(defaultDataFor(res.step));
      } catch (e: any) {
        setError(e?.message || "Failed to load approval info");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const onSetData = (k: string, v: any) => setData((p) => ({ ...p, [k]: v }));

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnack({ open: true, text: "Copied to clipboard" });
    } catch {
      setSnack({ open: true, text: "Copy failed (browser blocked)" });
    }
  };

  const doSubmit = async () => {
    if (!token) return;

    if (action === "REJECT") {
      setConfirmRejectOpen(true);
      return;
    }

    setSubmit({ kind: "loading" });
    try {
      const resp = await submitApproval(token, {
        action: "APPROVE",
        comments: comments || undefined,
        data: data || {},
      });

      // Completed
      if (resp?.status === "COMPLETED" || resp?.message === "Completed") {
        setSubmit({
          kind: "success",
          message: "Completed ✅ (Final HR Approved & Closed)",
          requestId: resp.requestId,
          finalStatus: resp.status || "COMPLETED",
        });
        return;
      }

      // Approved -> next step
      setSubmit({
        kind: "success",
        message: "Approved ✅",
        requestId: resp.requestId,
        nextStep: resp.nextStep,
        nextLink: resp.nextLink,
      });
    } catch (e: any) {
      setSubmit({ kind: "error", message: e?.message || "Submit failed" });
    }
  };

  const confirmReject = async () => {
    if (!token) return;

    setConfirmRejectOpen(false);
    setSubmit({ kind: "loading" });

    try {
      const resp = await submitApproval(token, {
        action: "REJECT",
        comments: comments || undefined,
        data: data || {},
      });

      setSubmit({
        kind: "success",
        message: "Rejected ❌ (Saved)",
        requestId: resp.requestId,
        finalStatus: resp.status || "REJECTED",
      });
    } catch (e: any) {
      setSubmit({ kind: "error", message: e?.message || "Reject failed" });
    }
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={22} />
          <Typography color="text.secondary">Loading approval…</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2 }}>
        <Paper sx={{ p: 3, width: { xs: "100%", sm: 680 } }}>
          <Alert severity="error">{error}</Alert>
          <Typography sx={{ mt: 1.5 }} color="text.secondary">
            This can happen if the token is invalid, expired, or already used.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!info || !step) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2 }}>
        <Paper sx={{ p: 3, width: { xs: "100%", sm: 680 } }}>
          <Typography>No approval data</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2, py: 4 }}>
      <Stack spacing={2} sx={{ width: { xs: "100%", sm: 880 } }}>
        {/* Header / Summary */}
        <Paper sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="h5" fontWeight={900}>
                Approval Required
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Request ID: <b>{info.requestId}</b>
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
              <Chip label={step} variant="outlined" />
              <Chip
                label={`${info.employee.employeeName} (${info.employee.employeeId})`}
                color="primary"
                variant="outlined"
              />
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <Typography><b>Department:</b> {info.employee.department}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><b>Job Title:</b> {info.employee.jobTitle}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><b>Last Working Day:</b> {info.employee.lastWorkingDay}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><b>Reason:</b> {info.employee.reasonForExit}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Workflow Stepper (FIXED: uses MuiStep) */}
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>
            Workflow Progress
          </Typography>

          <Stepper activeStep={activeStep} alternativeLabel>
            {FLOW.map((s) => (
              <MuiStep key={s}>
                <StepLabel>{s}</StepLabel>
              </MuiStep>
            ))}
          </Stepper>
        </Paper>

        {/* Action Card */}
        <Paper sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={2}>
            <Typography variant="h6" fontWeight={900}>
              Your Action ({step})
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                variant={action === "APPROVE" ? "contained" : "outlined"}
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => setAction("APPROVE")}
              >
                Approve
              </Button>
              <Button
                variant={action === "REJECT" ? "contained" : "outlined"}
                color="error"
                startIcon={<CancelRoundedIcon />}
                onClick={() => setAction("REJECT")}
              >
                Reject
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <StepFields step={step} data={data} onSetData={onSetData} />

          <TextField
            label="Comments"
            placeholder="Enter remarks/comments"
            multiline
            minRows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            sx={{ mt: 2 }}
          />

          {submit.kind === "error" && <Alert severity="error" sx={{ mt: 2 }}>{submit.message}</Alert>}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button onClick={doSubmit} disabled={submit.kind === "loading"}>
              {submit.kind === "loading" ? "Submitting..." : "Submit"}
            </Button>
          </Stack>
        </Paper>

        {/* Result / Next-step box */}
        {submit.kind === "success" && (
          <Paper sx={{ p: 2.5, border: "1px solid rgba(34,197,94,0.35)" }}>
            <Alert severity="success">{submit.message}</Alert>

            {submit.requestId && (
              <Typography sx={{ mt: 1 }} color="text.secondary">
                Request: <b>{submit.requestId}</b>
              </Typography>
            )}

            {submit.nextStep && (
              <Typography sx={{ mt: 0.5 }} color="text.secondary">
                Next Step: <b>{submit.nextStep}</b>
              </Typography>
            )}

           {submit.nextStep && (
			  <Typography sx={{ mt: 0.5 }} color="text.secondary">
				Next Step: <b>{submit.nextStep}</b> (Notification sent to the next approver)
			  </Typography>

            )}
          </Paper>
        )}

        {/* Timeline */}
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={900}>Timeline / Log</Typography>
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            {info.timeline?.length ? (
              info.timeline.map((t, i) => (
                <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    <b>{t.at}</b> | {t.who}: {t.action} {t.details ? `- ${t.details}` : ""}
                  </Typography>
                </Paper>
              ))
            ) : (
              <Typography color="text.secondary">No timeline yet</Typography>
            )}
          </Stack>
        </Paper>
      </Stack>

      {/* Reject confirm dialog */}
      <Dialog open={confirmRejectOpen} onClose={() => setConfirmRejectOpen(false)}>
        <DialogTitle>Confirm Reject</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to reject this request? This will mark it as REJECTED.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setConfirmRejectOpen(false)}>Cancel</Button>
          <Button color="error" onClick={confirmReject}>Reject</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={1800}
        onClose={() => setSnack({ open: false, text: "" })}
        message={snack.text}
      />
    </Box>
  );
}

// -------- Step-specific fields component --------
function StepFields({
  step,
  data,
  onSetData,
}: {
  step: ApprovalStep;
  data: Record<string, any>;
  onSetData: (k: string, v: any) => void;
}) {
  if (step === "MANAGER") {
    return (
      <Alert severity="info">
        Manager step: review details and provide comments, then approve or reject.
      </Alert>
    );
  }

  if (step === "FINANCE") {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Pending Salary"
            placeholder="No due"
            value={data.pendingSalary ?? ""}
            onChange={(e) => onSetData("pendingSalary", e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Recovery"
            type="number"
            value={data.recovery ?? 0}
            onChange={(e) => onSetData("recovery", Number(e.target.value))}
          />
        </Grid>
      </Grid>
    );
  }

  if (step === "IT") {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Laptop Returned"
            value={data.laptopReturned ?? "No"}
            onChange={(e) => onSetData("laptop Returned", e.target.value)}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Email Disabled"
            value={data.emailDisabled ?? "No"}
            onChange={(e) => onSetData("emailDisabled", e.target.value)}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="VPN Disabled"
            value={data.vpnDisabled ?? "No"}
            onChange={(e) => onSetData("vpnDisabled", e.target.value)}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Other Systems"
            placeholder="Any other system access removed?"
            value={data.otherSystems ?? ""}
            onChange={(e) => onSetData("otherSystems", e.target.value)}
          />
        </Grid>
      </Grid>
    );
  }

  if (step === "ADMIN") {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="ID Card Returned"
            value={data.idCardReturned ?? "No"}
            onChange={(e) => onSetData("idCardReturned", e.target.value)}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Parking Disabled"
            value={data.parkingDisabled ?? "No"}
            onChange={(e) => onSetData("parkingDisabled", e.target.value)}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            label="Desk Cleared"
            value={data.deskCleared ?? "No"}
            onChange={(e) => onSetData("deskCleared", e.target.value)}
          >
            <MenuItem value="Yes">Yes</MenuItem>
            <MenuItem value="No">No</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    );
  }

  // FINAL_HR
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Experience Letter"
          value={data.experienceLetter ?? "No"}
          onChange={(e) => onSetData("experienceLetter", e.target.value)}
        >
          <MenuItem value="Yes">Yes</MenuItem>
          <MenuItem value="No">No</MenuItem>
        </TextField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Exit Interview"
          value={data.exitInterview ?? "No"}
          onChange={(e) => onSetData("exitInterview", e.target.value)}
        >
          <MenuItem value="Yes">Yes</MenuItem>
          <MenuItem value="No">No</MenuItem>
        </TextField>
      </Grid>
    </Grid>
  );
}