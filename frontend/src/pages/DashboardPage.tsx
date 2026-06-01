import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/Layout/AppShell";
import { listRequests } from "../api/requests";
import type { RequestRow } from "../api/requests";
import { api } from "../api/http";


import {
  Box,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";


function StatusChip({ status }: { status: string }) {
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

function StepChip({ step }: { step: string }) {
  return <Chip label={step} variant="outlined" size="small" />;
}

const RESEND_ALLOWED_STEPS = new Set(["MANAGER", "FINANCE", "IT", "ADMIN"]);

export default function DashboardPage() {
  const nav = useNavigate();

  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listRequests(statusFilter || undefined);
      setRows(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const hay = `${r.id} ${r.employeeName} ${r.employeeId} ${r.department} ${r.jobTitle}`.toLowerCase();
      return hay.includes(s);
    });
  }, [rows, search]);

  const canResend = (r: any) =>
    (r.status === "SUBMITTED" || r.status === "IN_PROGRESS") && RESEND_ALLOWED_STEPS.has(r.currentStep);

  const resend = async (requestId: string) => {
    try {
      const resp = await api<{ message: string; step: string; to: string; link: string }>(
        `/api/requests/${requestId}/resend`,
        "POST",
        {},
        true
      );
      alert(`Resent to ${resp.to} (${resp.step})`);
    } catch (e: any) {
      alert(e?.message || "Resend failed");
    }
  };

  const deleteReq = async (requestId: string, status: string) => {
    // Optional: restrict delete to old statuses only (uncomment if you want)
    // if (!(status === "COMPLETED" || status === "REJECTED")) {
    //   alert("Delete is allowed only for COMPLETED or REJECTED requests.");
    //   return;
    // }

    const ok = confirm("Are you sure you want to delete this request? This cannot be undone.");
    if (!ok) return;

    try {
      await api(`/api/requests/${requestId}`, "DELETE", {}, true);
      alert("Deleted ✅");
      load();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  };

  return (
    <AppShell title="HR Dashboard">
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ width: { xs: "100%", sm: 220 } }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="SUBMITTED">SUBMITTED</MenuItem>
              <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
              <MenuItem value="HR_PENDING">HR_PENDING</MenuItem>
              <MenuItem value="REJECTED">REJECTED</MenuItem>
              <MenuItem value="COMPLETED">COMPLETED</MenuItem>
            </TextField>

            <TextField
              label="Search"
              placeholder="Request ID / Employee / Dept / Job"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Box sx={{ display: "flex", gap: 1, justifyContent: { xs: "flex-start", sm: "flex-end" }, width: { sm: 280 } }}>
              <Button variant="outlined" onClick={load}>
                Refresh
              </Button>
              <Button onClick={() => nav("/requests/new")}>
                New Request
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={900}>
              Requests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: {filtered.length}
            </Typography>
          </Stack>

          {loading && (
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={22} />
              <Typography color="text.secondary">Loading...</Typography>
            </Stack>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><b>Request ID</b></TableCell>
                    <TableCell><b>Employee</b></TableCell>
                    <TableCell><b>Department / Title</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                    <TableCell><b>Step</b></TableCell>
                    <TableCell align="right"><b>Actions</b></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{r.id}</TableCell>

                      <TableCell>
                        <Typography fontWeight={800}>{r.employeeName}</Typography>
                        <Typography variant="body2" color="text.secondary">{r.employeeId}</Typography>
                      </TableCell>

                      <TableCell>
                        <Typography fontWeight={800}>{r.department}</Typography>
                        <Typography variant="body2" color="text.secondary">{r.jobTitle}</Typography>
                      </TableCell>

                      <TableCell><StatusChip status={r.status} /></TableCell>
                      <TableCell><StepChip step={r.currentStep} /></TableCell>

                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                          <Button variant="text" onClick={() => nav(`/requests/${r.id}`)}>View</Button>
                          <Button variant="outlined" onClick={() => nav(`/requests/${r.id}/print`)}>Print</Button>

                          {canResend(r) && (
                            <Button color="warning" variant="contained" onClick={() => resend(r.id)}>
                              Resend Link
                            </Button>
                          )}

                          <Button
                            color="error"
                            variant="outlined"
                            onClick={() => deleteReq(r.id, r.status)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography color="text.secondary">No requests found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Paper>
      </Stack>
    </AppShell>
  );
}