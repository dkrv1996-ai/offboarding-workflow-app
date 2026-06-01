import { useNavigate } from "react-router-dom";
import { clearToken } from "../../api/http";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
} from "@mui/material";
import AppFooter from "./AppFooter";

export default function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const nav = useNavigate();

  const logout = () => {
    clearToken();
    localStorage.removeItem("user");
    nav("/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",          // ✅ full screen height
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {/* Left side title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography fontWeight={900}>Offboarding Workflow</Typography>
          </Box>

          {/* Right side nav buttons */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button color="inherit" variant="text" onClick={() => nav("/dashboard")}>
              Dashboard
            </Button>

            <Button color="inherit" variant="text" onClick={() => nav("/requests/new")}>
              New Request
            </Button>

            <Button color="error" variant="contained" onClick={logout}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Page Content */}
      <Container
        maxWidth="lg"
        sx={{
          py: 3,
          flex: 1,   // ✅ pushes footer to bottom
        }}
      >
        <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>
          {title}
        </Typography>

        {children}
      </Container>

      {/* Footer */}
      <AppFooter />
    </Box>
  );
}
