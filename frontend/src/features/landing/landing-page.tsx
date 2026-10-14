import { CtaSection } from "./components/cta-section";
import { Hero } from "./components/hero";
import { Pipeline } from "./components/pipeline";
import { Safeguards } from "./components/safeguards";
import { Showcase } from "./components/showcase";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";

export function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
                <Hero />
                <Pipeline />
                <Showcase />
                <Safeguards />
                <CtaSection />
            </main>
            <SiteFooter />
        </div>
    );
}
