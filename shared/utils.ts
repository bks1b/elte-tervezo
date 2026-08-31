export const getRuns = <T>(arr: number[], f: (r: number[]) => T) =>
  arr.concat(0).reduce(
    (res, x) =>
      (!res[1].length || res[1].at(-1) === x - 1
        ? [res[0], res[1].concat(x)]
        : [res[0].concat([f(res[1])]), [x]]) as [T[], number[]],
    [[], []] as [T[], number[]],
  )[0];

export const sum = <T>(arr: T[], f = (x: T) => x as unknown as number) =>
  arr.reduce((s, x) => s + f(x), 0);

export const increment = <K extends string>(map: Partial<Record<K, number>>, key: K) =>
  map[key] = (map[key] || 0) + 1;

export const intersects = ([l1, r1 = l1]: number[], [l2, r2]: number[], discrete = false) =>
  (x => discrete ? x >= 0 : x > 0)(Math.min(r1, r2) - Math.max(l1, l2));

export const join = (...xs: (string | number)[]) => xs.join('-');
