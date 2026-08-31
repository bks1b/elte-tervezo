import { bulkSearch, getGroup } from '../../server/tanrend/index.js';
import { endpoint } from '../../server/utils.js';

export default endpoint(
  async q => bulkSearch(q.semester, await getGroup(q.semester, q.group, q.grade)),
  ['semester', 'group', 'grade'],
);
