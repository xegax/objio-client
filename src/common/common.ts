export function cn(...arr: Array<string>): string {
  return arr.filter(v => v).join(' ');
}

export function clone<T = Object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
