import { VercelRequest, VercelResponse } from '@vercel/node';

import { getSemesters } from '../server/semesters.js';
import { getGroups } from '../server/tanrend/index.js';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (!process.env.CRON_SECRET || req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`)
    await Promise.all([getGroups(true), getSemesters(true)]);
  else res.status(401);
  res.setHeader('Cache-Control', 'no-store').json({});
};
