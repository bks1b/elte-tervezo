import { search, SEARCH_MODES } from '../../server/tanrend/index.js';
import { endpoint, normalizeQuery } from '../../server/utils.js';
import { Subjects } from '../../shared/types.js';

export default endpoint(
  q =>
    SEARCH_MODES[+(q.mode === '1')].reduce(
      async (subjects, mode) => search(q.semester, normalizeQuery(q.query), mode, await subjects),
      Promise.resolve({} as Subjects),
    ),
  ['mode', 'semester', 'query'],
);
