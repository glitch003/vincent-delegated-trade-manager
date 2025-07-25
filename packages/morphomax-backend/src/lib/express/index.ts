import cors from 'cors';
import express, { Express } from 'express';

import { createVincentUserMiddleware } from '@lit-protocol/vincent-app-sdk/expressMiddleware';

import { handleListPurchasesRoute } from './purchases';
import {
  handleListSchedulesRoute,
  handleEnableScheduleRoute,
  handleDisableScheduleRoute,
  handleCreateScheduleRoute,
  handleDeleteScheduleRoute,
  handleEditScheduleRoute,
} from './schedules';
import { env } from '../env';
import { serviceLogger } from '../logger';

const { ALLOWED_AUDIENCE, CORS_ALLOWED_DOMAIN, IS_DEVELOPMENT, VINCENT_APP_ID } = env;

const { handler, middleware } = createVincentUserMiddleware({
  allowedAudience: ALLOWED_AUDIENCE,
  requiredAppId: VINCENT_APP_ID,
  userKey: 'user',
});

const corsConfig = {
  optionsSuccessStatus: 204,
  origin: IS_DEVELOPMENT ? true : [CORS_ALLOWED_DOMAIN],
};

export const registerRoutes = (app: Express) => {
  app.use(express.json());

  if (IS_DEVELOPMENT) {
    serviceLogger.info(`CORS is disabled for development`);
  } else {
    serviceLogger.info(`Configuring CORS with allowed domain: ${CORS_ALLOWED_DOMAIN}`);
  }
  app.use(cors(corsConfig));

  app.get('/purchases', middleware, handler(handleListPurchasesRoute));
  app.get('/schedules', middleware, handler(handleListSchedulesRoute));
  app.post('/schedule', middleware, handler(handleCreateScheduleRoute));
  app.put('/schedules/:scheduleId', middleware, handler(handleEditScheduleRoute));
  app.put('/schedules/:scheduleId/enable', middleware, handler(handleEnableScheduleRoute));
  app.put('/schedules/:scheduleId/disable', middleware, handler(handleDisableScheduleRoute));
  app.delete('/schedules/:scheduleId', middleware, handler(handleDeleteScheduleRoute));

  serviceLogger.info(`Routes registered`);
};
