import { bulkSearch } from '../../server/tanrend/index.js';
import { endpoint } from '../../server/utils.js';

export default endpoint(q => bulkSearch(q.semester, q.codes.split(',')), ['semester', 'codes']);
