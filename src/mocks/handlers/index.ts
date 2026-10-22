// Combines all handlers. ladder-backend serves every endpoint now, so nothing is mocked; add a
// handler here only for an endpoint the backend does not have yet (rules.md §11).
import type { RequestHandler } from 'msw';

export const handlers: RequestHandler[] = [];
