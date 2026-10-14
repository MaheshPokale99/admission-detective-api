import { Compass } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
    return (
        <EmptyState
            icon={Compass}
            title="Page not found"
            description="The page you are looking for does not exist or has moved."
            action={
                <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                    Back to dashboard
                </Link>
            }
        />
    );
}
