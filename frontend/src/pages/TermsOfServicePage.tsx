import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import AppFooter from "../components/Layout/AppFooter";

export default function TermsOfServicePage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h4" fontWeight={900}>
              Terms of Service
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Effective Date: 26 May 2026
            </Typography>

            <Typography>
              These Terms of Service govern the use of the Global Offboarding platform and apply
              to all internal users and authorized stakeholders using the system.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              1. Intended Use
            </Typography>
            <Typography>
              This platform is intended exclusively for managing internal employee offboarding workflows,
              including approval sequencing, HR closure, record generation, and reporting.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              2. User Responsibilities
            </Typography>
            <Typography>
              Users must ensure that all information entered into the system is accurate,
              complete, and relevant to the offboarding process. Users must not share credentials
              or token approval links with unauthorized parties.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              3. Access and Permissions
            </Typography>
            <Typography>
              Access rights are governed by assigned roles. Admin and HR users may manage requests and approvals,
              while Guest users are limited to approved read-only functions.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              4. Availability
            </Typography>
            <Typography>
              The service is provided on an internal-use basis and may be updated, patched,
              restricted, or temporarily unavailable during maintenance or technical changes.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              5. Compliance
            </Typography>
            <Typography>
              All use of the platform must comply with applicable company policy, information security rules,
              and employment process controls.
            </Typography>

            <Typography variant="h6" fontWeight={800}>
              6. Limitation
            </Typography>
            <Typography>
              The application is intended to support process execution and documentation.
              Final operational and HR accountability remains with authorized business stakeholders.
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
