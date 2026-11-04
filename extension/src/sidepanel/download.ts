/** `2026-11-04_14-05` — used in export file names. */
export function fileStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

/** Characters that are not allowed in file names (`host:8080` → `host_8080`). */
export function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|\s]+/g, '_');
}

/** Saves text as a file via a Blob link (no `downloads` API needed). */
export function download(filename: string, text: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
