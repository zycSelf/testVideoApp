export function getUrl(binary, type) {
  const buffer = binary.buffer;
  const blob = new Blob([buffer], type);
  const url = URL.createObjectURL(blob);
  return url;
}
