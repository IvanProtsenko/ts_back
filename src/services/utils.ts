import request from 'request';
import fs from 'fs';

export function groupBy<T>(array: T[], key: keyof T): Map<T[keyof T], T[]> {
  const map = new Map<T[keyof T], T[]>();
  for (const item of array) {
    const value = item[key];
    const group = map.get(value);
    if (!group) {
      map.set(value, [item]);
    } else {
      group.push(item);
    }
  }
  return map;
}

export function download(url: string, path: string, callback: any) {
  request.head(url, (err, res, body) => {
    request(url).pipe(fs.createWriteStream(path)).on('close', callback);
  });
}

export function createDir(path: string) {
  fs.mkdir(path, { recursive: true }, (err) => {
    if (err) throw err;
  });
}

export const sleep = async (delayInMs: number) =>
  new Promise((r) => setTimeout(r, delayInMs));
