export function cn(...arr: Array<string>): string {
  return arr.filter(v => v).join(' ');
}
