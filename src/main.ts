import axios from 'axios';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Event } from './types';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
interface RawEvent {
  client_id: string;
  store_id: string;
  type: 'visit' | 'recharge';
  amount?: number;
  timestamp: string;
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function loadAndPostEvents(): Promise<string[]> {
  const dataPath = path.resolve(__dirname, '../data/ruklo_events_1000.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const rawEvents: RawEvent[] = JSON.parse(raw);

  const events: Event[] = rawEvents.map(e => ({
    clientId:  e.client_id,
    storeId:   e.store_id,
    type:      e.type,
    amount:    e.amount,
    timestamp: e.timestamp,
  }));

  for (const e of events) {
    await axios.post('http://localhost:3002/events', e);
  }


  return Array.from(new Set(events.map(e => e.clientId)));
}

async function showBenefits(clientIds: string[]) {
  let any = false;
  for (const id of clientIds) {
    const res = await axios.get<{ clientId: string; benefits: any[] }>(
      `http://localhost:3002/clients/${id}/benefits`
    );
    if (res.data.benefits.length > 0) {
      any = true;
      console.log(`\nBeneficios para ${id}:`);
      console.table(res.data.benefits);
    }
  }
  if (!any) {
    console.log('\nNingún cliente cumple la condición para el beneficio automático.');
  }
}

async function showHistory(clientIds: string[]) {
  const type = await prompt("¿Qué historial desea? (visit / recharge): ");
  if (!['visit', 'recharge'].includes(type)) {
    console.log('Opción inválida. Saliendo.');
    return;
  }

  console.log('\nClientes disponibles:');
  clientIds.forEach(id => console.log(` - ${id}`));
  const id = await prompt('\nIngrese el clientId: ');
  if (!clientIds.includes(id)) {
    console.log('clientId no reconocido. Saliendo.');
    return;
  }

  const res = await axios.get<{ clientId: string; visits: any[]; rechargesByWeek: any[] }>(
    `http://localhost:3002/clients/${id}/history`
  );

  if (type === 'visit') {
    console.log(`\nVisitas de ${id}:`);
    console.table(res.data.visits);
  } else {
    console.log(`\nPromedio de recargas semanales de ${id}:`);
    console.table(res.data.rechargesByWeek);
  }
}
async function clearDatabase() {
  await prisma.benefit.deleteMany({});
  await prisma.event.deleteMany({});
  console.log('Database cleared');
}

async function main() {
  await clearDatabase();
  const clientIds = await loadAndPostEvents();

  const choice = await prompt(
    "Ingrese 1 para otorgar beneficio automático\n2 para ver historial de transacciones: "
  );

  if (choice === '1') {
    await showBenefits(clientIds);
  } else if (choice === '2') {
    await showHistory(clientIds);
  } else {
    console.log('Opción inválida. Terminando.');
  }
}

main().catch(err => {
  console.error('Error en main:', err);
  process.exit(1);
});
