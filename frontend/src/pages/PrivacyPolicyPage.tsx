import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import AppFooter from "../components/Layout/AppFooter";

export default function PrivacyPolicyPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={900}>
              Privacy Policy
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Effective Date: 26 May 2026
            </Typography>

            <Typography>
              Global Offboarding values privacy and data confidentiality. This application is
              intended for internal offboarding workflow management and is designed to process
              employee separation records, approval decisions, audit trail events, and clearance documentation.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              1. Information We Collect
            </Typography>
            <Typography>
              The system may store employee details, department information, exit reasons,
              approver contact information, workflow actions, timestamps, comments, and print-ready records
              generated during the offboarding lifecycle.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              2. Purpose of Processing
            </Typography>
            <Typography>
              Personal and workflow information is processed solely to manage the employee offboarding process,
              ensure proper departmental clearances, maintain compliance, recover company assets,
              and generate official exit documentation.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              3. Access Control
            </Typography>
            <Typography>
              Access is limited by role. HR and Admin users have workflow management permissions,
              while Guest users have limited view-only access. Department approvers access
              only their assigned approval step through secure token links.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              4. Data Retention
            </Typography>
            <Typography>
              Records may be retained for audit, HR compliance, legal, and operational purposes
              according to internal retention requirements and local policy.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              5. Security
            </Typography>
            <Typography>
              The system uses authentication, role-based access control, audit logs, and tokenized approval links
              to reduce unauthorized access. Administrative safeguards should be maintained by the organization.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              6. Changes to This Policy
            </Typography>
            <Typography>
              This Privacy Policy may be updated from time to time to reflect process, legal,
              or technical changes. Updated versions become effective once published in the application.
            </Typography>

            <Typography variant="body2" sx={{ pt: 2 }}>
              <Link to="/login">Back to Login</Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>

      <AppFooter />
    </Box>
  );
}