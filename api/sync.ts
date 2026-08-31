import { VercelRequest, VercelResponse } from '@vercel/node';

import { getGroups } from '../server/tanrend/index.js';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (
    !process.env.CRON_SECRET || req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
  ) { await getGroups(true); } else { res.status(401); }
  res.setHeader('Cache-Control', 'no-store').json({});
};
