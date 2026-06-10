import { setupServer } from 'msw/node';

import { apiHandlers } from './msw-handlers';

export const mswServer = setupServer(...apiHandlers);
