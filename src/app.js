import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import securityMiddleware from '#middleware/security.middleware.js';

import authRoutes from '#routes/auth.routes.js';
import usersRoutes from '#routes/users.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

app.use(securityMiddleware);

app.get('/', (req, res) => {
  logger.info('Hello from API!');
  res.status(200).send('Hello from API!');
});

app.get('/health', (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const minutes = Math.floor(uptimeSeconds / 60);
  const seconds = uptimeSeconds % 60;
  const formattedUptime = `${minutes}m ${seconds}s`;

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: formattedUptime,
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Acquisition API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

export default app;
