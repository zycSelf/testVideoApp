const arr = ['/data/outputExport_0.ts', '/data/outputExport_1.ts'];
console.log(arr.reduce((a, b) => a + b + '|', ''));
