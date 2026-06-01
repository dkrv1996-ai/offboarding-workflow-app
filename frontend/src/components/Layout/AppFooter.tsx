import { Box, Container, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        py: 2,
        backgroundColor: "transparent",
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2026 Global Offboarding. All rights reserved.
          </Typography>

          <Stack direction="row" spacing={2}>
            <Link
              component={RouterLink}
              to="/privacy-policy"
              underline="hover"
              color="inherit"
              sx={{ fontSize: 14 }}
            >
              Privacy Policy
            </Link>

            <Link
              component={RouterLink}
              to="/terms-of-service"
              underline="hover"
              color="inherit"
              sx={{ fontSize: 14 }}
            >
              Terms of Service
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
