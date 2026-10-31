import { MeProvider } from "@/components/app/me-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <MeProvider>{children}</MeProvider>;
}
