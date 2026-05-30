/** Minimal chrome for fax popup windows — no Shell, no auth redirect. */
export default function PopupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">{children}</div>
  );
}
