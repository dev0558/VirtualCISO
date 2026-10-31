export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function parse(res: Response) {
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const detail =
      typeof body === "object" && body && "detail" in body
        ? Array.isArray(body.detail)
          ? body.detail.map((d: { msg: string }) => d.msg).join("; ")
          : String(body.detail)
        : res.statusText;
    throw new ApiError(res.status, detail);
  }
  return body;
}

const base = "/api/v1";

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(base + path, {
    credentials: "same-origin",
    ...rest,
    headers: {
      "X-Requested-With": "securavantage",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  return parse(res) as Promise<T>;
}

export const fetcher = <T,>(path: string) => api<T>(path);

export function downloadUrl(path: string) {
  return base + path;
}
