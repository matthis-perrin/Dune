export function getWindowId(): string {
  const id = new URLSearchParams(window.location.search).get('id') || '';
  return id;
}
