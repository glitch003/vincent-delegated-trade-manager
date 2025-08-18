import * as Sentry from '@sentry/node';

import { env } from './env';

const { IS_DEVELOPMENT } = env;

Sentry.init({
  dsn: 'https://d15e416de9d8557c68a6dbd8c73d4201@o4509482456842240.ingest.us.sentry.io/4509842410700801',
  enabled: !IS_DEVELOPMENT,
  sendDefaultPii: true,
});
