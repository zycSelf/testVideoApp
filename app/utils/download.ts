import { getUrl } from './getBlobUrl';

export const downloadFile = (filename: string, data: Uint8Array) => {
  const url = getUrl(data, { type: 'video/mp4' });
  console.log(url);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
