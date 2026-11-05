/**
 * F-010: the State tab works only on local dev servers — localhost, *.localhost,
 * the whole loopback range 127.x.x.x, IPv6 [::1] and 0.0.0.0. LAN IPs are not local.
 */
export function isLocalUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      host === '[::1]' ||
      host === '0.0.0.0'
    );
  } catch {
    return false;
  }
}
