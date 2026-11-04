import { CONTACT_HREF, DEMO_MODE } from "@/lib/demo";

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="bg-primary text-primary-foreground rounded-t-xl px-4 py-2 text-center text-xs">
      Read-only demo with fictional data. Want this for your company?{" "}
      <a href={CONTACT_HREF} className="font-medium underline underline-offset-2">Get in touch</a>
    </div>
  );
}
