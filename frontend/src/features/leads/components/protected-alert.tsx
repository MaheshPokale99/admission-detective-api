import { Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ProtectedAlert({ reasons }: { reasons: string[] }) {
    return (
        <Alert variant="destructive">
            <Lock />
            <AlertTitle>Outreach is locked for this lead</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-4">
                    {reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
}
