/**
 * Request name exactly like the DevTools Network "Name" column (F-008, Session #2 Q3):
 * last path segment + query string.
 *
 *   https://site.az/api/v1/passports                    → passports
 *   https://site.az/api/tasks?sort=regNumber&x=IN_WORK  → tasks?sort=regNumber&x=IN_WORK
 *   https://site.az/api/users/                          → users/
 *   https://site.az/                                    → site.az
 */
export function requestName(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  const segments = url.pathname.split('/');
  let name = segments.pop() ?? '';
  if (name === '') {
    // Path ends with "/": use the previous segment + "/" (DevTools behaviour).
    const prev = segments.pop();
    name = prev ? `${prev}/` : url.host;
  }

  let decoded = name;
  try {
    decoded = decodeURIComponent(name);
  } catch {
    // keep the raw segment if it is not valid percent-encoding
  }

  return decoded + url.search;
}
