export default function StatusBadge({ status }: { status: string }) {
  const color =
    status === "COMPLETED"
      ? "#16a34a"
      : status === "REJECTED"
      ? "#dc2626"
      : status === "IN_PROGRESS"
      ? "#f59e0b"
      : "#64748b";

  return (
    <span
      style={{
        background: color,
        color: "white",
        padding: "4px 8px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}
