import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getBenefits(req: Request, res: Response) {
  const clientId = req.params.id;
  try {
    const benefits = await prisma.benefit.findMany({
      where: { clientId },
      orderBy: { grantedAt: 'asc' },
    });
    res.json({ clientId, benefits });
  } catch (err) {
    console.error('Error fetching benefits:', err);
    res.status(500).json({ error: 'Could not fetch benefits' });
  }
}
