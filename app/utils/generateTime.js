export function generateTime(time) {
  let currentTime = time;
  let H = '00';
  let M = '00';
  let S = '00';
  if (currentTime > 360) {
    H = Math.floor(currentTime / 360);
    if (H <= 9) H = '0' + H;
    currentTime = currentTime % 360;
  }
  if (currentTime > 60) {
    M = Math.floor(currentTime / 60);
    if (M <= 9) M = '0' + M;
    currentTime = currentTime % 60;
  }
  S = isFloat(currentTime) ? currentTime.toFixed(3).toString() : currentTime;
  if (S <= 9) S = '0' + S;
  return `${H}:${M}:${S}`;
}
export function isFloat() {
  return true;
}
export function generateMMSSTime(time) {
  // time: s
  let current = time;
  let MM = '00';
  let SS = '00';
  if (time > 60) {
    MM = Math.floor(current / 60);
    current = current % 60;
  }
  SS = current;
  if (typeof MM === 'number' && MM < 10) {
    MM = '0' + MM;
  }
  if (typeof SS === 'number' && SS < 10) {
    SS = '0' + SS;
  }
  return MM + ':' + SS;
}
