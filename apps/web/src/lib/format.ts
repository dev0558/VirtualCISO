import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export const fmtDate = (s?: string | null) => (s ? format(parseISO(s), "d MMM yyyy") : "—");
export const fmtDateTime = (s?: string | null) => (s ? format(parseISO(s), "d MMM yyyy, HH:mm") : "—");
export const ago = (s?: string | null) => (s ? `${formatDistanceToNowStrict(parseISO(s))} ago` : "never");

export const CONNECTOR_LABEL: Record<string, string> = {
  m365: "Microsoft 365",
  google_workspace: "Google Workspace",
  github: "GitHub",
};
export const ROLE_LABEL: Record<string, string> = { client_admin: "Client admin", vciso: "vCISO", auditor: "Auditor" };
