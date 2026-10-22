// Auth is served by ladder-backend. These handlers only watch for a new account or session so
// the mocked Government ID / liveness steps from a previous one are not carried over.
import { http, passthrough } from 'msw';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { mockDb } from '../db';
import { url } from './http';

const resetAndPassthrough = () => {
  mockDb.reset();
  return passthrough();
};

export const authHandlers = [
  http.post(url(ENDPOINTS.auth.signup), resetAndPassthrough),
  http.post(url(ENDPOINTS.auth.login), resetAndPassthrough),
  http.post(url(ENDPOINTS.auth.logout), resetAndPassthrough),
];
