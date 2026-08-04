import type { Core } from '@strapi/strapi';

// Acciones REST de lectura que se habilitan para el rol Public,
// para que el build de agitalo-suave pueda consumir el API sin token.
const PUBLIC_READ_ACTIONS = [
  'api::blog.blog.find',
  'api::blog.blog.findOne',
  'api::legal.legal.find',
  'api::legal.legal.findOne',
];

export default {
  register({ strapi }: { strapi: Core.Strapi }) {},

  /**
   * Bootstrap: asegura que el rol Public tenga permisos de lectura
   * sobre blog y legal. Idempotente.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensurePublicReadPermissions(strapi);
  },
};

async function ensurePublicReadPermissions(strapi: Core.Strapi) {
  try {
    const publicRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) {
      strapi.log.warn('[cms] No se encontro el rol Public; no se ajustaron permisos.');
      return;
    }

    const existing = await strapi.db.query('plugin::users-permissions.permission').findMany({
      where: { role: publicRole.id, action: { $in: PUBLIC_READ_ACTIONS } },
    });

    const granted = new Set(existing.map((p: { action: string }) => p.action));

    for (const action of PUBLIC_READ_ACTIONS) {
      if (granted.has(action)) {
        continue;
      }
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({ data: { action, role: publicRole.id } });
      strapi.log.info(`[cms] Permiso publico habilitado: ${action}`);
    }
  } catch (err) {
    strapi.log.warn('[cms] No se pudieron configurar permisos publicos automaticamente:');
    strapi.log.warn(err instanceof Error ? err.message : String(err));
  }
}
