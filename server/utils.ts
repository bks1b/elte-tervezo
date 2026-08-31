import { VercelRequest, VercelResponse } from '@vercel/node';

export const GROUPS = [[['', 18]], [['A', 18], ['B', 25], ['C', 18, true]]] as const;
export const GRADES = ['1', '2', '3'];
export const ID_SUFFIX = /-\d{1,2}$/;

const MAX_AGE = 60 * 60 * 2;

export const endpoint =
  <T extends string>(result: (q: Record<T, string>) => Promise<unknown>, params: T[] = []) =>
  (req: VercelRequest, res: VercelResponse) =>
    result(
      Object.fromEntries(
        params.map(
          k => [
            k,
            (Array.isArray(req.query[k]) ? req.query[k][0] : req.query[k] ?? '').replaceAll(
              '+',
              ' ',
            ),
          ]
        ),
      ) as Record<T, string>,
    ).then(
      (params.length
        ? res
        : res.setHeader('Cache-Control', `public, s-maxage=${MAX_AGE}, max-age=${MAX_AGE}`)).json,
    );

export const normalizeQuery = (q: string) => q.trim().toLowerCase();

export const memoize = <A extends unknown[], T, U>(
  f: (...args: A) => Promise<T>,
  g: (x: T) => U,
) => {
  let result: U | undefined;
  return async (...args: A) => result ??= await g(await f(...args));
};
