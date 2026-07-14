/**
 * upload.js
 * ------------------------------------------------------------------
 * Batasan upload foto aset. Foto disimpan di Supabase Storage (bukan
 * lagi base64 di kolom database) — lihat app/routers/assets.py ->
 * POST /assets/upload-photo.
 * ------------------------------------------------------------------
 */
export const MAX_PHOTO_SIZE_MB = 2;
export const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = "image/jpeg,image/png,image/webp";
export const PHOTO_HINT_TEXT = `JPG, PNG, or WEBP — max ${MAX_PHOTO_SIZE_MB}MB.`;
