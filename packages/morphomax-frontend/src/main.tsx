import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App';

import { env } from '@/config/env';

const { VITE_IS_DEVELOPMENT, VITE_SENTRY_DSN } = env;

if (VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: VITE_SENTRY_DSN,
    enabled: !VITE_IS_DEVELOPMENT,
    sendDefaultPii: true,
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
