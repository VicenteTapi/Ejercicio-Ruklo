import { PrismaClient } from '@prisma/client';
import { Event } from '../types';

const prisma = new PrismaClient();
const visitCounter = new Map<string, number>();

export async function processEvent(e: Event) {
  const key = getCounterKey(e);
  const currentCount = getCurrentCount(key);

  if (isRecharge(e)) {
    resetCount(key);
  } else {
    await handleVisit(e, key, currentCount);
  }

  await saveEvent(e);
}

function getCounterKey(e: Event): string {
  return `${e.clientId}|${e.storeId}`;
}

function getCurrentCount(key: string): number {
  return visitCounter.get(key) ?? 0;
}

function isRecharge(e: Event): boolean {
  return e.type === 'recharge';
}

function resetCount(key: string): void {
  visitCounter.set(key, 0);
}

async function handleVisit(e: Event, key: string, previousCount: number): Promise<void> {
  const updatedCount = previousCount + 1;

  if (updatedCount >= 5) {
    await grantBenefit(e);
    visitCounter.set(key, 0);
  } else {
    visitCounter.set(key, updatedCount);
  }
}

async function grantBenefit(e: Event): Promise<void> {
  await prisma.benefit.create({
    data: {
      clientId: e.clientId,
      storeId: e.storeId,
      type: 'FiveVisitsNoRecharge',
    },
  });
}

async function saveEvent(e: Event): Promise<void> {
  await prisma.event.create({
    data: {
      clientId: e.clientId,
      storeId: e.storeId,
      type: e.type,
      amount: e.amount,
      timestamp: new Date(e.timestamp),
    },
  });
}