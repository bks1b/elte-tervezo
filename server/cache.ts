import { neon } from '@neondatabase/serverless';
import { getCache } from '@vercel/functions';
import { brotliCompressSync, brotliDecompressSync } from 'zlib';

const sql = neon(process.env.DATABASE_URL!);
const cache = getCache();

const inFlight = new Map<string, Promise<unknown>>();

export default <T>(key: string, f: (overwrite?: boolean) => Promise<T>) =>
  (overwrite =>
    inFlight.get(key) || inFlight.set(
      key,
      (async () => {
        const cached = !overwrite && await cache.get(key);
        const obj = (payload =>
          payload
          && {
            payload,
            result: JSON.parse(
              brotliDecompressSync(Buffer.from(payload, 'base64')).toString('utf8'),
            ),
          })(
            cached || !overwrite && (await sql`
              SELECT value
              FROM cache
              WHERE key = ${key}
              LIMIT 1
            `)[0]?.value?.toString(),
          )
          || await f(overwrite).then(result => ({
            payload: brotliCompressSync(JSON.stringify(result)).toString('base64'),
            result,
          })).then(x =>
            sql`
              INSERT INTO cache (key, value)
              VALUES (${key}, ${x.payload})
              ON CONFLICT (key)
              DO UPDATE SET value = EXCLUDED.value
            `.then(() => x)
          );
        if (!cached) await cache.set(key, obj.payload);
        return obj.result;
      })(),
    ).get(key)!.finally(() => inFlight.delete(key))) as typeof f;
