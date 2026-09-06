import { getGroup } from '../../server/tanrend/index.js';
import { endpoint } from '../../server/utils.js';

export default endpoint(q => getGroup(q.semester, q.group, q.grade), [
  'semester',
  'group',
  'grade',
]);
