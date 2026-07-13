import PocketBase from "pocketbase";

// Same-origin in production (the built app is served by PocketBase
// itself out of pb_public). In dev, Vite's proxy (see vite.config.js)
// forwards /api to a locally running `pocketbase serve`.
export const pb = new PocketBase("/");

// Keep the teachers auth collection name in one place.
export const TEACHERS_COLLECTION = "teachers";

export function isTeacherLoggedIn() {
  return pb.authStore.isValid && pb.authStore.record?.collectionName === TEACHERS_COLLECTION;
}

export function currentTeacher() {
  return pb.authStore.record;
}

export function logoutTeacher() {
  pb.authStore.clear();
}
