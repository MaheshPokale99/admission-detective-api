"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { useRefreshAll } from "@/hooks/use-api";
import { api, errorMessage } from "@/lib/api";

export function ResetDemo() {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const refresh = useRefreshAll();

    const reset = async () => {
        setBusy(true);
        try {
            await api.reset();
            await refresh();
            toast.success("Demo data reloaded");
            setOpen(false);
        } catch (e) {
            toast.error(errorMessage(e, "Reset failed"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger render={<SidebarMenuButton tooltip="Reset demo data" />}>
                <RotateCcw aria-hidden />
                <span>Reset demo data</span>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This reloads the seeded leads and removes every investigation, approval and outcome recorded so
                        far.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" disabled={busy} onClick={reset}>
                        {busy && <Spinner />}
                        Reset data
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
