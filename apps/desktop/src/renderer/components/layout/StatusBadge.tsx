import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Registered: "bg-success/15 text-success border-success/30",
  Delivered: "bg-success/15 text-success border-success/30",
  Emailed: "bg-success/15 text-success border-success/30",
  Offline: "bg-muted text-muted-foreground border-border",
  Pending: "bg-warning/20 text-foreground border-warning/40",
  Queued: "bg-warning/20 text-foreground border-warning/40",
  Failed: "bg-destructive/15 text-destructive border-destructive/30",
  Canceled: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string }) {
  const showDot = ["Registered", "Offline", "Delivered", "Failed", "Queued", "Emailed", "Pending", "Canceled"].includes(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[status] ?? "bg-muted text-muted-foreground border-border")}>
      {showDot && <span className={cn("h-1.5 w-1.5 rounded-full",
        status === "Registered" || status === "Delivered" || status === "Emailed" ? "bg-success" :
        status === "Failed" ? "bg-destructive" :
        status === "Queued" || status === "Pending" ? "bg-warning" : "bg-muted-foreground/60"
      )} />}
      {status}
    </span>
  );
}

const eventStyles: Record<string, string> = {
  FAX_RECEIVED: "bg-teal/10 text-teal border-teal/30",
  FAX_SENT: "bg-navy/10 text-navy border-navy/30",
  VOICEMAIL: "bg-accent text-accent-foreground border-border",
  E911_UPDATE: "bg-warning/15 text-foreground border-warning/40",
  PROVISIONING: "bg-success/15 text-success border-success/30",
  SIP_AUTH_FAILURE: "bg-destructive/15 text-destructive border-destructive/30",
};
export function EventBadge({ type }: { type: string }) {
  return <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[11px] font-mono font-medium tracking-tight", eventStyles[type] ?? "bg-muted text-muted-foreground border-border")}>{type}</span>;
}
