import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#3b82f6" }, // nicer blue
    background: {
      default: "#0b1220",
      paper: "#0f172a", // solid paper so text is visible
    },
    text: {
      primary: "#e5e7eb",
      secondary: "#a3a3a3",
    },
    divider: "rgba(255,255,255,0.12)",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: `"Segoe UI", system-ui, -apple-system, Arial, sans-serif`,
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none", // prevents weird gradients in dark mode
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", fullWidth: true },
    },
    MuiButton: {
      defaultProps: { variant: "contained", size: "large" },
    },
  },
});