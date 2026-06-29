/** Strip accidental quotes from .env values (e.g. FRONTEND_URL="http://...") */
export function stripEnvQuotes(value: string): string {
  return value.replace(/^["']+|["']+$/g, '').trim();
}

export function getFrontendUrl(): string {
  const raw = process.env.FRONTEND_URL?.trim();
  return raw ? stripEnvQuotes(raw) : 'http://localhost:5173';
}

/** Dev-friendly CORS: localhost, 127.0.0.1, and LAN IPs on any port */
export function isDevOriginAllowed(origin: string): boolean {
  return (
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
    /^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
    /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)
  );
}
