import express from 'express';
import eventsRouter from './routes/events';
import historyRouter from './routes/history';
import benefitsRouter from './routes/benefits';

const app = express();
app.use(express.json());
app.use(eventsRouter);
app.use(historyRouter);
app.use(benefitsRouter);
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));