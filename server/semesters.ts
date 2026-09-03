import { Dict } from '../shared/types.js';
import cache from './cache.js';

const CACHE_KEY = 'semesters';
const URL = 'https://neptun.elte.hu/oktig/tanugyi-idorend';
const MD_REGEX = /\s?\|\s?/;

export const getSemesters = cache(CACHE_KEY, () =>
  fetch(URL).then(res => res.text()).then(res => {
    const rows = res.match(/name="Text" value="(.+?)"/)?.[1].split('&#xD;&#xA;');
    if (!rows) return;
    let i = rows.indexOf('### Félévek rendje') + 3;
    const header = rows[i - 1].split(MD_REGEX);
    const cols = ['Félév', 'Szorgalmi időszak'].map(x => header.indexOf(x));
    const semesters: Dict = {};
    while (rows[++i]) {
      const split = rows[i].split(/\s?\|\s?/);
      semesters[split[cols[0]].replace(/^(\d{2})(\d{2})\/(\d{2})\/(\d)$/, '$1$2-$1$3-$4')] =
        split[cols[1]].match(/\d{4}-\d{2}-\d{2}/g)![0];
    }
    return semesters;
  }));
