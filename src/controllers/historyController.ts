import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfWeek, addWeeks, formatISO } from 'date-fns';

const prisma = new PrismaClient();

export async function getHistory(req: Request, res: Response) {
  const clientId = req.params.id;
  try {
    const visits = await prisma.event.findMany({
      where: { clientId, type: 'visit' },
      orderBy: { timestamp: 'asc' },
    });
    const recharges = await prisma.event.findMany({
      where: { clientId, type: 'recharge' },
      orderBy: { timestamp: 'asc' },
    });

    const dates = recharges.map(r => r.timestamp);
    const start = dates.length
      ? startOfWeek(dates[0], { weekStartsOn: 1 })
      : new Date();
    const end = dates.length
      ? startOfWeek(dates[dates.length - 1], { weekStartsOn: 1 })
      : start;

    const weeks: string[] = [];
    let cursor = start;
    while (cursor <= end) {
      weeks.push(formatISO(cursor, { representation: 'date' }));
      cursor = addWeeks(cursor, 1);
    }

  
    const agg: Record<string, { sum: number; count: number }> = {};
    recharges.forEach(r => {
      const wk = formatISO(startOfWeek(r.timestamp, { weekStartsOn: 1 }), { representation: 'date' });
      if (!agg[wk]) agg[wk] = { sum: 0, count: 0 };
      agg[wk].sum += r.amount ?? 0;
      agg[wk].count += 1;
    });

    const rechargesByWeek = weeks.map(week => ({
      weekStart: week,
      avgAmount: agg[week] ? agg[week].sum / agg[week].count : 0,
    }));

    res.json({ clientId, visits, rechargesByWeek });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Could not fetch history' });
  }
}
