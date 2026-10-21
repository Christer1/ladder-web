// Combines all handlers.
import { authHandlers } from './auth.handlers';
import { profileHandlers } from './profile.handlers';
import { verificationHandlers } from './verification.handlers';

export const handlers = [...authHandlers, ...verificationHandlers, ...profileHandlers];
