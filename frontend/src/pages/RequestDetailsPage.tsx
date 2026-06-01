import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/Layout/AppShell";
import { getRequestDetails, type RequestDetails } from "../api/requestDetails";
import { hrFinalDecision } from "../api/hrFinal";

import {
  Alert,
  Paper,
  Stack,
  Typography,
  Divider,
  Chip,
  Grid,
  Button,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  TextField,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";

function safeParseJson(s?: string | null) {
  try {
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

function StatusChip({ status }: { status: RequestDetails["status"] }) {
  const color =
    status === "COMPLETED"
      ? "success"
      : status === "REJECTED"
      ? "error"
      : status === "IN_PROGRESS" || status === "HR_PENDING"
      ? "warning"
      : "default";
  return <Chip label={status} color={color as any} size="small" />;
}

function StepChip({ step }: { step: RequestDetails["currentStep"] }) {
  return <Chip label={step} variant="outlined" size="small" />;
}

function ApprovalCard({ title, approval }: { title: string; approval?: any }) {
  if (!approval) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography fontWeight={900}>{title}</Typography>
        <Typography color="text.secondary">No data</Typography>
      </Paper>
    );
  }

  const data = safeParseJson(approval.dataJson);
  const stColor =
    approval.status === "APPROVED" ? "success" : approval.status === "REJECTED" ? "error" : "default";

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography fontWeight={900}>{title}</Typography>
        <Chip
          label={approval.status}
          color={stColor as any}
          size="small"
          variant={approval.status === "PENDING" ? "outlined" : "filled"}
        />
      </Stack>

      <Divider sx={{ my: 1.2 }} />

      <Typography variant="body2" color="text.secondary">
        <b>Approver Email:</b> {approval.approverEmail}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        <b>Comments:</b> {approval.comments || ""}
      </Typography>

      {approval.actedAt && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          <b>Acted At:</b> {approval.actedAt}
        </Typography>
      )}

      {Object.keys(data).length > 0 && (
        <>
          <Divider sx={{ my: 1.2 }} />
          <Typography variant="subtitle2" fontWeight={800}>
            Other details
          </Typography>
          <Grid container spacing={1} sx={{ mt: 0.5 }}>
            {Object.entries(data).map(([k, v]) => (
              <Grid item xs={12} sm={6} key={k}>
                <Paper variant="outlined" sx={{ p: 1.2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <b>{k}:</b> {String(v)}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Paper>
  );
}

export default function RequestDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<RequestDetails | null>(null);

  // HR Final state
  const [hrFinalComments, setHrFinalComments] = useState("");
  const [hrFinalLoading, setHrFinalLoading] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: "success" | "error" | "info" | "warning";
  }>({ open: false, msg: "", sev: "info" });

  const load = async (requestId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await getRequestDetails(requestId);
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    load(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const approvalsMap = useMemo(() => {
    const map: Record<string, any> = {};
    (data?.approvals || []).forEach((a) => (map[a.step] = a));
    return map;
  }, [data]);

  const timeline = useMemo(() => {
    return (data?.auditLogs || [])
      .slice()
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [data]);

  const addTemplate = (text: string) => {
    setHrFinalComments((prev) => {
      const p = prev.trim();
      if (!p) return text;
      if (p.endsWith(".")) return `${p} ${text}`;
      return `${p}. ${text}`;
    });
  };

  const doHrFinal = async (action: "APPROVE" | "REJECT") => {
    if (!data) return;

    const comment = hrFinalComments.trim();
    if (!comment) {
      setSnack({ open: true, msg: "HR Final Comments is mandatory for both Approve & Reject.", sev: "error" });
      return;
    }

    setHrFinalLoading(true);
    try {
      await hrFinalDecision(data.id, action, comment);

      // Reload details
      await load(data.id);

      setHrFinalComments("");
      setSnack({
        open: true,
        msg: action === "APPROVE" ? "Approved & Closed ✅" : "Rejected ❌",
        sev: action === "APPROVE" ? "success" : "error",
      });
    } catch (e: any) {
      setSnack({ open: true, msg: e?.message || "HR final action failed", sev: "error" });
    } finally {
      setHrFinalLoading(false);
    }
  };

  return (
    <AppShell title="Request Details">
      {loading && (
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size={22} />
          <Typography color="text.secondary">Loading...</Typography>
        </Stack>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && data && (
        <Stack spacing={2}>
          {/* Header */}
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  {data.id}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                  <StatusChip status={data.status} />
                  <StepChip step={data.currentStep} />
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                <Button variant="outlined" onClick={() => nav("/dashboard")}>
                  Back
                </Button>
                <Button onClick={() => nav(`/requests/${data.id}/print`)}>Print</Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Employee Details */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={900}>
              Employee Details
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Name:</b> {data.employeeName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Employee ID:</b> {data.employeeId}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Department:</b> {data.department}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Job Title:</b> {data.jobTitle}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Last Working Day:</b> {data.lastWorkingDay}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Reason:</b> {data.reasonForExit}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Company Assets:</b> {data.companyAssets || ""}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>HR Comments:</b> {data.hrComments || ""}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Approver Emails (entered by HR at request creation) */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={900}>
              Approver Emails
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Manager:</b> {data.managerEmail || ""}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Finance:</b> {data.financeEmail || ""}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>IT:</b> {data.itEmail || ""}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography>
                  <b>Admin:</b> {data.adminEmail || ""}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography>
                  <b>Final HR (record field):</b> {data.finalHrEmail || ""}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* HR Final Decision Panel (mandatory comment for both Approve & Reject) */}
          {data.status === "HR_PENDING" && data.currentStep === "HR_FINAL" && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={900}>
                HR Final Decision
              </Typography>
              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                  <Button variant="outlined" onClick={() => addTemplate("Exit interview done")} disabled={hrFinalLoading}>
                    Add: Exit interview done
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => addTemplate("Experience letter will be issued later")}
                    disabled={hrFinalLoading}
                  >
                    Add: Experience letter later
                  </Button>
                </Stack>

                <TextField
                  label="HR Final Comments (Mandatory)"
                  placeholder="Example: Exit interview done. Experience letter will be issued later."
                  multiline
                  minRows={3}
                  value={hrFinalComments}
                  onChange={(e) => setHrFinalComments(e.target.value)}
                  required
                  helperText="Mandatory for both Approve & Close and Reject."
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button onClick={() => doHrFinal("APPROVE")} disabled={hrFinalLoading}>
                    {hrFinalLoading ? "Processing..." : "Approve & Close"}
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={() => doHrFinal("REJECT")}
                    disabled={hrFinalLoading}
                  >
                    {hrFinalLoading ? "Processing..." : "Reject"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}

          {/* Approvals */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={900}>
              Approvals
            </Typography>
            <Divider sx={{ my: 1.5 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ApprovalCard title="Manager" approval={approvalsMap.MANAGER} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ApprovalCard title="Finance" approval={approvalsMap.FINANCE} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ApprovalCard title="IT" approval={approvalsMap.IT} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ApprovalCard title="Admin" approval={approvalsMap.ADMIN} />
              </Grid>
              <Grid item xs={12}>
                <ApprovalCard title="HR Final" approval={approvalsMap.HR_FINAL} />
              </Grid>
            </Grid>
          </Paper>

          {/* Timeline */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={900}>
              Timeline / Log
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>Date/Time</b>
                    </TableCell>
                    <TableCell>
                      <b>Who</b>
                    </TableCell>
                    <TableCell>
                      <b>Action</b>
                    </TableCell>
                    <TableCell>
                      <b>Details</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeline.map((t, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{t.at}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{t.who}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{t.action}</TableCell>
                      <TableCell>{t.details || ""}</TableCell>
                    </TableRow>
                  ))}
                  {timeline.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">No timeline entries</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Stack>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          severity={snack.sev}
          variant="filled"
          sx={{ width: "100%" }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </AppShell>
  );
}