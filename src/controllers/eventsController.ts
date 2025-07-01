import { Request, Response } from 'express';
import { processEvent } from '../services/eventsProcessor';
import { Event } from '../types';

export async function postEvent(req: Request, res: Response) {
  const body = req.body;
  const event: Event = {
    clientId:  body.client_id ?? body.clientId,
    storeId:   body.store_id  ?? body.storeId,
    type:      body.type,
    amount:    body.amount,
    timestamp: body.timestamp,
  };

  try {
    await processEvent(event);
    res.status(201).end();
  } catch (err) {
    console.error('Error processing event:', err);
    res.status(500).json({ error: 'Processing failed' });
  }
}
