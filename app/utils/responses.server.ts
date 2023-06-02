import { redirect } from "@remix-run/server-runtime";

export function redirectBack(
  request: Request,
  { fallback, ...init }: ResponseInit & { fallback: string }
) {
  const referer = request.headers.get("Referer");
  if (referer) {
    const url = new URL(referer);
    return redirect(url.pathname + url.search, init);
  }
  return redirect(fallback, init);
}
