type EventType = 'visit' | 'recharge';

export interface Event {
  clientId: string;
  storeId: string;
  type: EventType;
  amount?: number;
  timestamp: string;
}