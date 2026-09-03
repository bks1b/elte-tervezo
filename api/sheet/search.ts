import { getSearchHandler } from '../../server/sheet/index.js';
import { endpoint, normalizeQuery } from '../../server/utils.js';

export default endpoint(
  async q => (await getSearchHandler())?.search(normalizeQuery(q.query), +(q.faculty === '1')),
  ['query', 'faculty'],
);
