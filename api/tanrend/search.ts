import { search } from '../../server/tanrend/index.js';
import { endpoint } from '../../server/utils.js';

export default endpoint(q => search(q.semester, q.query, q.mode === '1', q.resolve === '1'), [
  'semester',
  'query',
  'mode',
  'resolve',
]);
