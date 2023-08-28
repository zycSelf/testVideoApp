export function getDBData(filename) {
  return new Promise((resolve, reject) => {
    const res = indexedDB.open('/data');
    res.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['FILE_DATA']);
      const objectStore = transaction.objectStore('FILE_DATA');
      const request = objectStore.get(filename);
      request.onsuccess = (transcationRes) => {
        console.log(transcationRes.target.result);
        resolve(transcationRes.target.result);
      };
    };
  });
}
