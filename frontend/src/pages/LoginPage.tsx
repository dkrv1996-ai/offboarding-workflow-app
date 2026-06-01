import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { api, setToken } from "../api/http";
import AppFooter from "../components/Layout/AppFooter";

type LoginResp = {
  token: string;
  user: {
    username: string;
    role: "ADMIN" | "HR" | "GUEST";
    name: string;
    email?: string;
  };
};

export default function LoginPage() {
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    try {
      const resp = await api<LoginResp>(
        "/api/auth/login",
        "POST",
        { username: username.trim(), password },
        false
      );

      setToken(resp.token);

      // optional: keep user info locally if you want later
      localStorage.setItem("user", JSON.stringify(resp.user));

      nav("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 35%), linear-gradient(135deg, #0f172a 0%, #111827 45%, #1f2937 100%)",
      }}
    >
      {/* Main centered content */}
      <Box
        sx={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          px: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: { xs: "100%", sm: 460 },
            p: 3,
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.16)",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255,255,255,0.06)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            color: "#fff",
          }}
        >
          <Stack spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, textAlign: "center" }}>
              Offboarding Workflow
            </Typography>

            <Typography sx={{ opacity: 0.8, fontSize: 13, textAlign: "center" }}>
              Secure access for HR / Admin / Guest
            </Typography>
          </Stack>

          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                InputLabelProps={{ sx: { color: "rgba(255,255,255,0.8)" } }}
                sx={{
                  "& .MuiInputBase-root": {
                    color: "#fff",
                    backgroundColor: "rgba(255,255,255,0.04)",
                  },
                }}
              />

              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputLabelProps={{ sx: { color: "rgba(255,255,255,0.8)" } }}
                sx={{
                  "& .MuiInputBase-root": {
                    color: "#fff",
                    backgroundColor: "rgba(255,255,255,0.04)",
                  },
                }}
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </Button>

              <Typography variant="body2" sx={{ opacity: 0.75, textAlign: "center", pt: 1 }}>
                
              </Typography>
            </Stack>
          </form>
        </Paper>
      </Box>

      {/* Fixed-at-bottom footer via flex layout */}
      <AppFooter />
    </Box>
  );
}
