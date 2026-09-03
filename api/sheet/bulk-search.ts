import { getSearchHandler } from '../../server/sheet/index.js';
import { endpoint } from '../../server/utils.js';

export default endpoint(async q => (await getSearchHandler())?.bulkSearch(q.id.split(',')), ['id']);
