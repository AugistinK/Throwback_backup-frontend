/**
 * src/utils/imageUrl.js
 * Helpers robustes pour gérer l'URL de la photo de profil:
 * - Pas de "/[object Object]"
 * - Corrige un mauvais ID dans l'URL
 * - Ajoute un cache-buster optionnel
 * - Fallback propre vers un avatar par défaut
 */

/* ============================
   Base URL du backend (env)
   - support Vite (VITE_API_URL) et CRA (REACT_APP_API_URL)
   - sans slash final
============================ */
const envApi =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL)) ||
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.VITE_API_URL || process.env.REACT_APP_API_URL));

const DEFAULT_API = 'https://throwback-backup-backend.onrender.com';

const normalizeBase = (u) => {
  if (!u && u !== 0) return '';
  const s = String(u).trim();
  return s.replace(/\/+$/, '');
};

export const baseUrl = normalizeBase(envApi || DEFAULT_API);

/* ============================
   Utilitaires internes
============================ */
const ensureString = (v) => {
  if (v === null || v === undefined) return '';
  try {
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && 'url' in v) return String(v.url);
    return String(v);
  } catch {
    return '';
  }
};

const MONGO_ID_RE = /^[a-f\d]{24}$/i;

export const getUserId = (userOrId) => {
  const cand =
    (userOrId && (userOrId._id || userOrId.id)) ||
    (typeof userOrId === 'string' ? userOrId : '');
  const id = ensureString(cand);
  return MONGO_ID_RE.test(id) ? id : '';
};

export const toAbsoluteUrl = (val) => {
  const s = ensureString(val).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${baseUrl}${path}`.replace(/\s+/g, '');
};

export const buildUserPhotoUrl = (userOrId) => {
  const id = getUserId(userOrId);
  return id ? `${baseUrl}/api/users/${id}/photo` : '';
};

export const extractIdFromPhotoUrl = (url) => {
  const s = ensureString(url);
  const m = s.match(/\/api\/users\/([a-f\d]{24})\/photo(?:\b|\/|\?|#|$)/i);
  return m ? m[1] : '';
};

/**
 * S'assure que l'URL pointe bien sur le bon _id utilisateur.
 * - Si l'URL contient un autre id, on la réécrit avec le bon.
 * - Si l'URL est relative, on la rend absolue.
 * - Si l'URL est vide, on construit via l'id.
 */
export const normalizePhotoUrlForUser = (user, url) => {
  const id = getUserId(user);
  const abs = toAbsoluteUrl(url);
  if (abs) {
    const urlId = extractIdFromPhotoUrl(abs);
    if (urlId && id && urlId !== id) {
      return buildUserPhotoUrl(id);
    }
    return abs;
  }
  // pas d'URL fournie → on construit avec l'id
  return id ? buildUserPhotoUrl(id) : '';
};

/** Ajoute un cache-buster: ?t=<seed> */
export const withBust = (url, seed = Date.now()) => {
  const s = ensureString(url);
  if (!s) return s;
  const sep = s.includes('?') ? '&' : '?';
  return `${s}${sep}t=${seed}`;
};

/**
 * URL finale de l'avatar:
 * - priorité à user.photo_profil_url (normalisée sur le bon id)
 * - sinon fallback GET /api/users/:id/photo
 * - sinon avatar par défaut
 * Options:
 *   - bust: bool (ajoute un cache-buster)
 *   - defaultSrc: string (chemin image par défaut)
 */
export const getAvatarUrl = (
  user,
  { bust = false, defaultSrc = '/images/default-avatar.png' } = {}
) => {
  if (!user) return defaultSrc;

  let url = '';
  if (user.photo_profil_url) {
    url = normalizePhotoUrlForUser(user, user.photo_profil_url);
  }
  if (!url) {
    const id = getUserId(user);
    if (id) url = buildUserPhotoUrl(id);
  }
  if (!url) return defaultSrc;

  return bust ? withBust(url) : url;
};

export default {
  baseUrl,
  toAbsoluteUrl,
  getUserId,
  buildUserPhotoUrl,
  extractIdFromPhotoUrl,
  normalizePhotoUrlForUser,
  withBust,
  getAvatarUrl,
};
