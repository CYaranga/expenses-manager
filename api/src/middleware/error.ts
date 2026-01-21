import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  if (err instanceof HTTPException) {
    return c.json(
      { success: false, error: err.message },
      err.status
    );
  }

  return c.json(
    { success: false, error: 'Internal server error' },
    500
  );
}
