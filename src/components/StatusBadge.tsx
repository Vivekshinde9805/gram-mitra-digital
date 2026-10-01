import { cn } from "@/lib/utils";
import { useI18n, type TKey } from "@/lib/i18n";

const styles: Record<string, string> = {
  pending: "bg-warning/20 text-foreground border-warning",
  in_review: "bg-info/15 text-info border-info/40",
  approved: "bg-success/15 text-success border-success/40",
  completed: "bg-success/15 text-success border-success/40",
  paid: "bg-success/15 text-success border-success/40",
  rejected: "bg-destructive/10 text-destructive border-destructive/40",
  unpaid: "bg-destructive/10 text-destructive border-destructive/40",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles[status] ?? "bg-muted")}>
      {t(status as TKey) ?? status}
    </span>
  );
}
