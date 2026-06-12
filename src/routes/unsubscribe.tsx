import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, MailX } from "lucide-react";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Unsubscribe — AccessNow BD" },
      { name: "description", content: "Manage your email preferences for AccessNow BD." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UnsubscribePage,
});

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "already" }
  | { kind: "invalid"; message: string };

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid", message: "Missing unsubscribe token." });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/email/unsubscribe?token=${encodeURIComponent(token)}`,
        );
        const data = (await res.json().catch(() => ({}))) as {
          valid?: boolean;
          reason?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setState({ kind: "invalid", message: data.error ?? "Invalid or expired link." });
          return;
        }
        if (data.valid) setState({ kind: "valid" });
        else if (data.reason === "already_unsubscribed") setState({ kind: "already" });
        else setState({ kind: "invalid", message: "This link is no longer valid." });
      } catch {
        if (!cancelled) setState({ kind: "invalid", message: "Could not reach the server." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch(`/email/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        reason?: string;
        error?: string;
      };
      if (data.success) setState({ kind: "success" });
      else if (data.reason === "already_unsubscribed") setState({ kind: "already" });
      else setState({ kind: "invalid", message: data.error ?? "Could not unsubscribe." });
    } catch {
      setState({ kind: "invalid", message: "Network error — please try again." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          {state.kind === "loading" || state.kind === "submitting" ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : state.kind === "success" || state.kind === "already" ? (
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          ) : state.kind === "invalid" ? (
            <AlertCircle className="h-10 w-10 text-destructive" />
          ) : (
            <MailX className="h-10 w-10 text-primary" />
          )}
        </div>

        {state.kind === "loading" && (
          <>
            <h1 className="text-xl font-semibold">Checking your link…</h1>
            <p className="text-sm text-muted-foreground mt-2">One moment please.</p>
          </>
        )}

        {state.kind === "valid" && (
          <>
            <h1 className="text-xl font-semibold">Unsubscribe from emails</h1>
            <p className="text-sm text-muted-foreground mt-2">
              আপনি AccessNow BD থেকে আর কোনো email পেতে চান না? নিচের button-এ click করে নিশ্চিত করুন।
            </p>
            <Button size="lg" className="mt-6 w-full" onClick={confirm}>
              Confirm unsubscribe
            </Button>
          </>
        )}

        {state.kind === "submitting" && (
          <>
            <h1 className="text-xl font-semibold">Unsubscribing…</h1>
            <p className="text-sm text-muted-foreground mt-2">Saving your preference.</p>
          </>
        )}

        {state.kind === "success" && (
          <>
            <h1 className="text-xl font-semibold">You're unsubscribed</h1>
            <p className="text-sm text-muted-foreground mt-2">
              আমরা এই email address-এ আর কোনো notification পাঠাব না।
            </p>
          </>
        )}

        {state.kind === "already" && (
          <>
            <h1 className="text-xl font-semibold">Already unsubscribed</h1>
            <p className="text-sm text-muted-foreground mt-2">
              এই email address আগে থেকেই unsubscribe করা আছে।
            </p>
          </>
        )}

        {state.kind === "invalid" && (
          <>
            <h1 className="text-xl font-semibold">Link not valid</h1>
            <p className="text-sm text-muted-foreground mt-2">{state.message}</p>
          </>
        )}

        <p className="text-xs text-muted-foreground mt-8">
          AccessNow BD · Dhaka, Bangladesh
        </p>
      </div>
    </div>
  );
}
