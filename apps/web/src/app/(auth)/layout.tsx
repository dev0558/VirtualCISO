import { Logo } from "@/components/marketing/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="self-center"><Logo /></div>
        {children}
        <p className="text-muted-foreground text-center text-xs text-balance">
          Readiness guidance for ISO/IEC 27001:2022 and NIST CSF 2.0. Not a certification.
        </p>
      </div>
    </div>
  );
}
