import type { User } from '../../shared/src';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  ASSETS: Fetcher;
}

export interface Variables {
  user: User;
  userId: string;
}

export type HonoEnv = {
  Bindings: Env;
  Variables: Variables;
};
