import { createContext, useContext, useMemo, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

type Snack = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

const Ctx = createContext<{ showSnack: (message: string, severity?: Snack["severity"]) => void } | null>(null);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snack, setSnack] = useState<Snack>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnack = (message: string, severity: Snack["severity"] = "info") => {
    setSnack({ open: true, message, severity });
  };

  const value = useMemo(() => ({ showSnack }), []);

  return (
    <Ctx.Provider value={value}>
      {children}
      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%" }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Ctx.Provider>
  );
}

export function useSnack() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSnack must be used inside SnackbarProvider");
  return ctx;
}
