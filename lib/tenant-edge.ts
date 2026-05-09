export function getTenantSlugFromHost(host: string): string | null {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

  if (host === rootDomain || host === `app.${rootDomain}`) return null;
  if (host === "localhost" || host === "localhost:3000") return null;

  const subdomain = host.replace(`.${rootDomain}`, "");
  if (!subdomain || subdomain === host) return null;

  return subdomain;
}
