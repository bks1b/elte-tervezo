import { getCache, RuntimeCache } from '@vercel/functions';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { brotliCompressSync, brotliDecompressSync } from 'zlib';

const LOCAL_CACHE_DIR = '.cache';
const LOCAL_CACHE_EXT = '.br';

const getLocalPath = (key: string) => join(LOCAL_CACHE_DIR, key + LOCAL_CACHE_EXT);
const getRuntimeCache = (): Omit<RuntimeCache, 'delete' | 'expireTag'> =>
  process.env.VERCEL
    ? getCache()
    : {
      get: async (key: string) =>
        existsSync(getLocalPath(key)) && readFileSync(getLocalPath(key), 'utf8'),
      set: async (key: string, value: unknown) => {
        mkdirSync(LOCAL_CACHE_DIR, { recursive: true });
        writeFileSync(getLocalPath(key), value as string);
      },
    };

const inFlight = new Map<string, Promise<unknown>>();

export default <T>(key: string, f: (overwrite: boolean) => Promise<T>) =>
async (overwrite = false): Promise<T> => {
  const cache = getRuntimeCache();
  const cached = !overwrite && await cache.get(key) as string;
  if (cached)
    return JSON.parse(brotliDecompressSync(Buffer.from(cached, 'base64')).toString('utf8'));
  if (inFlight.has(key)) return inFlight.get(key) as Promise<T>;
  const request = f(overwrite).then(res =>
    cache.set(key, brotliCompressSync(JSON.stringify(res)).toString('base64')).then(() => res)
  );
  inFlight.set(key, request);
  return request.finally(() => inFlight.delete(key));
};
