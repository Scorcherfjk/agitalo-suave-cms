import type { Core } from '@strapi/strapi';

// La base de datos es siempre Supabase (PostgreSQL), conectada via la connection
// string DATABASE_URL. No se usan credenciales por partes (host/port/user/pass).
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const connection = {
    client: 'postgres' as const,
    connection: {
      connectionString: env('DATABASE_URL'),
      // Supabase exige SSL. rejectUnauthorized en false porque los certificados
      // autofirmados / chains de Supabase no siempre se validan.
      ssl: env.bool('DATABASE_SSL', false) && {
        rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
      },
      schema: env('DATABASE_SCHEMA', 'public'),
    },
    pool: { min: env.int('DATABASE_POOL_MIN', 1), max: env.int('DATABASE_POOL_MAX', 10) },
    acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    // Los tipos de Strapi marcan host/port/db/user/password como obligatorios aunque
    // no se usen en runtime cuando DATABASE_URL trae la connection string completa.
  } as unknown as Core.Config.Database['connection'];

  return { connection };
};

export default config;
