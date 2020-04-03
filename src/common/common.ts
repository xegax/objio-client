export function cn(...arr: Array<string>): string {
  return arr.filter(v => v).join(' ');
}

export function clone<T = Object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function parseParams<TParams = {[key: string]: string}, THash = {[key: string]: string}>() {
  const pStr = window.location.search.split('?')[1] || '';
  const hStr = window.location.hash.split('#')[1] || '';

  const params = {} as TParams;
  (pStr || '').split('&').forEach(item => {
    const pair = item.split('=');
    params[pair[0]] = pair[1];
  });

  const hash = {} as THash;
  (hStr || '').split('&').forEach(item => {
    const pair = item.split('=');
    hash[pair[0]] = pair[1];
  });

  return { params, hash };
}

type Value = string | number | undefined;
type Params = {[key: string]: Value};

export function makeParams(obj: Params): string {
  let s = Object.keys(obj).map(k => {
    if (obj[k] == null)
      return '';
    return `${k}=${obj[k]}`
  }).filter(v => v).join('&');
  return s;
}

export function getURL(url: string, p: { params: Params, hash: Params }) {
  let params = makeParams(p.params);
  let hash = makeParams(p.hash);
  if (params)
    url += '?' + params;

  if (hash)
    url += '#' + hash;

  return url;
}
