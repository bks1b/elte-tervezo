export enum StorageKey {
  SUBJECTS = 'subjects',
  DARK_MODE = 'dark',
  COLORS = 'colors',
  HELP = 'help',
  SUBJECT_CONSTRAINTS = 'subjectConstraints',
  DAY_CONSTRAINTS = 'dayConstraints',
}

export const loadStorage = (key: StorageKey) => {
  try {
    return JSON.parse(localStorage.getItem(key)!);
  } catch {}
};
export const writeStorage = (key: StorageKey, data: unknown) =>
  localStorage.setItem(key, JSON.stringify(data));

export const gzip = async (x: string) =>
  btoa(
    Array.from(
      new Uint8Array(
        await new Response(new Blob([x]).stream().pipeThrough(new CompressionStream('gzip')))
          .arrayBuffer(),
      ),
      c => String.fromCharCode(c),
    ).join(''),
  ).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

export const gunzip = async (x: string) =>
  await new Response(
    new Blob([
      Uint8Array.from(
        atob(x.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - x.length % 4) % 4)),
        c => c.charCodeAt(0),
      ),
    ]).stream().pipeThrough(new DecompressionStream('gzip')),
  ).text();

export const download = (name: string, data: string) => {
  const a = document.createElement('a');
  a.href = data;
  a.download = name;
  a.click();
};

export const upload = (type: string) =>
  new Promise<File>((res, rej) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = type;
    inp.addEventListener('change', () => inp.files?.[0] ? res(inp.files[0]) : rej());
    inp.click();
  });
