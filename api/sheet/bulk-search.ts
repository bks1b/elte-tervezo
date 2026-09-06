import { bulkSearch } from '../../server/sheet/index.js';
import { endpoint } from '../../server/utils.js';

export default endpoint(async q => (await bulkSearch())?.(q.codes.split(',')), ['codes']);
