import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReportSummary, type ReportSummary } from "../api/reportSummary";
const OTHER_DETAILS = {
  manager: ["Laptop Received", "ID Card Returned"],
  finance: ["Clearance Completed", "No Dues"],
  it: ["Email Disabled", "System Access Removed"],
  admin: ["Access Card Returned", "Workspace Cleared"]
};

import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
} from "@mui/material";

function whoWithEmail(who: string, r: any) {
  const w = String(who || "").toUpperCase();
  if (w === "MANAGER") return `MANAGER (${r.managerEmail || ""})`;
  if (w === "FINANCE") return `FINANCE (${r.financeEmail || ""})`;
  if (w === "IT") return `IT (${r.itEmail || ""})`;
  if (w === "ADMIN") return `ADMIN (${r.adminEmail || ""})`;
  if (w === "HR_FINAL") return `HR_FINAL (${r.createdBy || ""})`;
  if (w === "HR") return `HR (${r.createdBy || ""})`;
  return who;
}

function fmtDtShort(v: string) {
  // Expected input like ISO string "2026-05-28T10:22:33.000Z" or any Date-parsable string
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dd}.${mm}.${yy} ${hh}.${min}`;
}

export default function PrintPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ReportSummary | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await getReportSummary(id);
        setData(res);
      } catch (e: any) {
        setError(e?.message || "Failed to load summary");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const timeline = useMemo(() => {
    return (data?.timeline || [])
      .slice()
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [data]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (error) return <div style={{ padding: 20, color: "crimson" }}>{error}</div>;
  if (!data) return <div style={{ padding: 20 }}>No data</div>;

  const r = data.request;
  const a = data.approvals || {};

  return (
    <Box sx={{ px: 2, py: 2 }}>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .paper { box-shadow: none !important; border: none !important; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
        }

        .print-black, .print-black * { color: #000 !important; }
        .print-black { font-size: 12px; line-height: 1.25; }

        .gridTable {
          border: 1px solid #000 !important;
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
        }
        .gridTable th, .gridTable td {
          border: 1px solid #000 !important;
          padding: 6px 8px !important;
          vertical-align: top !important;
          word-wrap: break-word !important;
          overflow-wrap: anywhere !important;
        }

        .labelCell { width: 230px !important; font-weight: 800 !important; background: #f2f2f2 !important; }
        .sectionTitle { font-weight: 900 !important; font-size: 14px !important; margin: 0 0 8px 0 !important; }

        .policyBox {
          border: 2px solid #000 !important;
          border-radius: 4px !important;
          overflow: hidden !important;
          margin-bottom: 12px !important;
          background: #fff !important;
          width: 100% !important;
        }
        .policyHeader {
          background: #e5e7eb !important;
          border-bottom: 2px solid #000 !important;
          padding: 8px 12px !important;
          font-weight: 900 !important;
          font-size: 14px !important;
          letter-spacing: 0.4px !important;
          text-transform: uppercase !important;
          text-align: center !important; /* ✅ centers EXIT CLEARANCE FORM + CLEARANCE BY SECTION */
        }
        .policyBody {
          padding: 10px 12px !important;
          font-size: 12px !important;
          line-height: 1.35 !important;
        }
        .policyBody p { margin: 6px 0 !important; }
        .policyBody .indent { margin-left: 18px !important; }

        .clearanceHeaderRow td {
          background: #e5e7eb !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.2px !important;
        }
				.gridTable {
		  border: 1px solid #000 !important;
		  width: 100% !important;
		  border-collapse: collapse !important;
		  table-layout: fixed !important;  /* keep fixed layout */
		}

		.gridTable th, .gridTable td {
		  border: 1px solid #000 !important;
		  padding: 6px 8px !important;
		  vertical-align: top !important;

		  /* ✅ keep content inside the cell */
		  white-space: normal !important;
		  word-break: break-word !important;
		  overflow-wrap: anywhere !important;

		  /* ✅ avoid spilling outside */
		  overflow: hidden !important;
		}
		/* Timeline column widths: keeps alignment stable */
			.timelineColTime { width: 95px !important; }
			.timelineColWho { width: 140px !important; }
			.timelineColAction { width: 110px !important; }
			.timelineColDetails { width: auto !important; }

      `}</style>

      <Stack className="no-print" direction="row" spacing={1.5} justifyContent="space-between" sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => nav(`/requests/${r.id}`)}>
          Back
        </Button>
        <Button onClick={() => window.print()}>Print / Save PDF</Button>
      </Stack>

      <Paper className="paper print-black" sx={{ p: 2.5, backgroundColor: "white" }}>
        {/* Header */}
        <Grid container spacing={1}>
          <Grid item xs={8}>
            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>ATA</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}></Typography>

            <Typography sx={{ mt: 0.6 }}>
              <b>Request ID:</b> {r.id} &nbsp; | &nbsp; <b>Status:</b> {r.status}
            </Typography>
            <Typography sx={{ mt: 0.2 }}>
              <b>Generated On:</b> {new Date().toLocaleString()}
            </Typography>
          </Grid>

          <Grid item xs={4} sx={{ textAlign: "right" }}>
            <Typography sx={{ fontWeight: 900 }}></Typography>
            <Typography></Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 1.5, borderColor: "#000" }} />

        {/* Guidelines box */}
        <Box className="avoid-break policyBox">
          <div className="policyHeader">EXIT CLEARANCE FORM</div>
          <div className="policyBody">
            <p>
              Employee offboarding is a collective responsibility involving all stakeholders. This form serves not only HR but also aids in fulfilling the diverse functional requirements necessary to ensure
              the return of ATA’s property and assets for security compliance. It is the manager&apos;s duty to ensure the thorough completion of this form and its timely submission to HR for proper
              documentation. Each section-in-charge is tasked with maintaining an updated checklist to accurately reflect the exit clearance process.
            </p>

            <p style={{ fontWeight: 900 }}>Guidelines to Complete:</p>

            <p>1. All employees leaving ATA must complete this form together with their Line Manager.</p>

            <p style={{ fontWeight: 800 }}>2. Actions required from Line manager:</p>
            <p className="indent">a) Review the sections where employee is required to complete clearance.</p>
            <p className="indent">b) For section/s where employee is not required to seek clearance, please strike off that section as “NA” and sign off.</p>
            <p className="indent">c) Ask concerned employee to proceed with clearance with required departments before final clearance with you.</p>
            <p className="indent">d) Complete the section on your department’s clearance, ensure return of indicated Company’s properties in good condition and sign off.</p>

            <p>
              3. This form must be fully completed and submitted by the employee to HR Team on the last working day (or your Line Manager if your last day of work falls on a non-working day). In such
              instances, Line Manager must forward the completed form and other applicable HR-related items to HR on the next immediate working day.
            </p>

            <p>
              4. Final payment will only be made when all Company-issued properties have been returned and Company loans or advances (if any) are settled.
            </p>

            <p>
              5. Any discrepancies arise or late submission may result in delay in release of your final salary payment, subject to tax clearance where applicable.
            </p>
          </div>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: "#000" }} />

        {/* Employee / Request Details (NO approver emails here) */}
        <Box className="avoid-break" sx={{ mb: 1.5 }}>
          <Typography className="sectionTitle">Employee / Request Details</Typography>

          <Table size="small" className="gridTable">
            <TableBody>
              <KVRow label="Employee Name" value={r.employeeName || ""} />
              <KVRow label="Employee ID" value={r.employeeId || ""} />
              <KVRow label="Department" value={r.department || ""} />
              <KVRow label="Job Title" value={r.jobTitle || ""} />
              <KVRow label="Country" value={r.country || ""} />
              <KVRow label="City" value={r.city || ""} />
              <KVRow label="Last Working Day" value={r.lastWorkingDay || ""} />
              <KVRow label="Reason for Exit" value={r.reasonForExit || ""} />
              <KVRow label="Company Assets" value={r.companyAssets || ""} />
              <KVRow label="HR Comments" value={r.hrComments || ""} />
            </TableBody>
          </Table>
        </Box>

        {/* Clearance by section */}
        <Box className="avoid-break policyBox" sx={{ mb: 1.5 }}>
          <div className="policyHeader">CLEARANCE BY SECTION</div>
          <div className="policyBody">
            <DeptBlock title="Manager Clearance" ap={a.MANAGER} approverEmail={r.managerEmail || ""} />
            <DeptBlock title="Finance Clearance" ap={a.FINANCE} approverEmail={r.financeEmail || ""} />
            <DeptBlock title="IT Clearance" ap={a.IT} approverEmail={r.itEmail || ""} />
            <DeptBlock title="Admin Clearance" ap={a.ADMIN} approverEmail={r.adminEmail || ""} />
            <DeptBlock title="HR Final Closure" ap={a.HR_FINAL} approverEmail={r.createdBy || ""} />
          </div>
        </Box>

        {/* Timeline */}
        <Box className="avoid-break" sx={{ mb: 1.5 }}>
          <Typography className="sectionTitle">Timeline / Log</Typography>

          <Table size="small" className="gridTable">
            <TableHead>
              <TableRow>
				<TableCell className="timelineColTime" sx={{ fontWeight: 900 }}>Date/Time</TableCell>
				<TableCell className="timelineColWho" sx={{ fontWeight: 900 }}>Who</TableCell>
				<TableCell className="timelineColAction" sx={{ fontWeight: 900 }}>Action</TableCell>
				<TableCell className="timelineColDetails" sx={{ fontWeight: 900 }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timeline.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="timelineColTime" sx={{ whiteSpace: "nowrap" }}>
						  {fmtDtShort(t.at)}
						</TableCell>

						<TableCell className="timelineColWho"> {whoWithEmail(t.who, r)}
						</TableCell>

						<TableCell className="timelineColAction">
						  {t.action}
						</TableCell>

						<TableCell className="timelineColDetails">
						  {t.details || ""}
						</TableCell>
                </TableRow>
              ))}
              {timeline.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>No timeline entries</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        {/* ONLY Human Resources signature */}
        <Box className="avoid-break" sx={{ mb: 1.5 }}>
          <Typography className="sectionTitle">Signature / Digital Signature</Typography>
          <Table size="small" className="gridTable">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, background: "#f2f2f2", width: "30%" }}>
                  Human Resources Signature / Digital Signature
                </TableCell>
                <TableCell sx={{ height: 50 }} />
                <TableCell sx={{ fontWeight: 900, background: "#f2f2f2", width: "15%" }}>
                  Date
                </TableCell>
                <TableCell sx={{ height: 50 }} />
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 1.2, borderColor: "#000" }} />
        <Typography sx={{ fontSize: 11, fontWeight: 700 }}>
          This is computer generated form no need to sign.
        </Typography>
      </Paper>
    </Box>
  );
}

function KVRow({ label, value }: { label: string; value: string }) {
  return (
    <TableRow>
      <TableCell className="labelCell">{label}</TableCell>
      <TableCell colSpan={3}>{value}</TableCell>
    </TableRow>
  );
}

function DeptBlock({ title, ap, approverEmail }: { title: string; ap: any; approverEmail: string }) {
  const status = ap?.status || "PENDING";
  const comments = ap?.comments || "";
  const dataObj = ap?.data || {};

  return (
    <Box className="avoid-break" sx={{ mb: 1 }}>
      <Table size="small" className="gridTable">
        <TableBody>
          <TableRow className="clearanceHeaderRow">
            <TableCell colSpan={4}>{title}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="labelCell">Approver Email</TableCell>
            <TableCell colSpan={3}>{approverEmail || ""}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="labelCell">Status</TableCell>
            <TableCell colSpan={3}>{status}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="labelCell">Comments / Remarks</TableCell>
            <TableCell colSpan={3}>{comments}</TableCell>
          </TableRow>

          <TableRow>
            <TableCell className="labelCell">Others Details</TableCell>
            <TableCell colSpan={3}>
              {Object.keys(dataObj).length === 0 ? (
                ""
              ) : (
                <Table size="small" className="gridTable" style={{ marginTop: 6, width: "100%" }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                      <TableCell sx={{ fontWeight: 900 }}>Field</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(dataObj).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell sx={{ fontWeight: 900, backgroundColor: "#fbfbfb" }}>{k}</TableCell>
                        <TableCell>{String(v)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
}