/// <reference path="../pb_data/types.d.ts" />

// =====================================================================
// DropSeal backend hooks
//
// IMPORTANT (PocketBase JSVM caveat): route/hook handler callbacks run
// in a pooled JS runtime and CANNOT close over top-level functions or
// variables declared elsewhere in this file -- only the built-in
// globals ($app, $os, $security, etc.) are guaranteed available inside
// a handler. Because of that, every handler below is fully
// self-contained instead of calling shared helper functions.
//
// What these hooks do:
//   1. POST /api/dropseal/folder-info    -> name + deadline for a
//      folder, WITHOUT ever exposing its password to the browser.
//   2. POST /api/dropseal/verify-password -> trades a correct password
//      for a short-lived signed "submit token" (a JWT) instead of
//      just returning true/false.
//   3. onRecordCreateRequest("submissions") -> requires a valid submit
//      token for the exact folder AND re-checks the deadline
//      server-side, so the countdown timer in the browser is only
//      ever a display -- enforcement happens here.
//   4. onRecordCreateRequest("folders") -> rejects a deadline that's
//      already in the past.
// =====================================================================

// ---------------------------------------------------------------------
// POST /api/dropseal/folder-info
// body: { folderId }
// ---------------------------------------------------------------------
routerAdd("POST", "/api/dropseal/folder-info", (e) => {
  const data = new DynamicModel({ folderId: "" });
  e.bindBody(data);

  if (!data.folderId) {
    throw new BadRequestError("folderId is required.");
  }

  let folder;
  try {
    folder = $app.findRecordById("folders", data.folderId);
  } catch (err) {
    throw new NotFoundError("That drop folder doesn't exist.");
  }

  const expired = Date.now() / 1000 > folder.getDateTime("deadline").unix();

  e.json(200, {
    name: folder.getString("name"),
    deadline: folder.getDateTime("deadline").string(),
    expired: expired,
  });
});

// ---------------------------------------------------------------------
// POST /api/dropseal/verify-password
// body: { folderId, password }
// ---------------------------------------------------------------------
routerAdd("POST", "/api/dropseal/verify-password", (e) => {
  const data = new DynamicModel({ folderId: "", password: "" });
  e.bindBody(data);

  if (!data.folderId) {
    throw new BadRequestError("folderId is required.");
  }
  if (!data.password) {
    throw new BadRequestError("Password is required.");
  }

  let folder;
  try {
    folder = $app.findRecordById("folders", data.folderId);
  } catch (err) {
    throw new NotFoundError("That drop folder doesn't exist.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const deadlineSeconds = folder.getDateTime("deadline").unix();

  if (nowSeconds > deadlineSeconds) {
    throw new ForbiddenError("This drop folder's deadline has passed.");
  }

  const storedPassword = folder.getString("password");
  if (!$security.equal(storedPassword, data.password)) {
    throw new ForbiddenError("Incorrect password.");
  }

  const secret = $os.getenv("SUBMIT_TOKEN_SECRET") || "dev-only-insecure-secret-change-me";
  const maxLifetime = 3 * 60 * 60; // hard ceiling: 3 hours
  const secondsUntilDeadline = deadlineSeconds - nowSeconds;
  const tokenLifetime = Math.max(60, Math.min(secondsUntilDeadline, maxLifetime));

  const token = $security.createJWT({ folderId: folder.id }, secret, tokenLifetime);

  e.json(200, {
    token: token,
    expiresInSeconds: tokenLifetime,
  });
});

// ---------------------------------------------------------------------
// Gate on creating "submissions" records.
// ---------------------------------------------------------------------
onRecordCreateRequest((e) => {
  const folderId = e.record.getString("folder");
  const info = e.requestInfo();
  const submitToken = info.headers["x_submit_token"];

  if (!submitToken) {
    throw new ForbiddenError("Missing submit token. Verify the folder password first.");
  }

  const secret = $os.getenv("SUBMIT_TOKEN_SECRET") || "dev-only-insecure-secret-change-me";

  let claims;
  try {
    claims = $security.parseJWT(submitToken, secret);
  } catch (err) {
    throw new ForbiddenError("Your submit session is invalid or expired. Re-enter the password.");
  }

  if (!claims || claims.folderId !== folderId) {
    throw new ForbiddenError("This submit token doesn't match this folder.");
  }

  let folder;
  try {
    folder = $app.findRecordById("folders", folderId);
  } catch (err) {
    throw new NotFoundError("That drop folder doesn't exist.");
  }

  const expired = Date.now() / 1000 > folder.getDateTime("deadline").unix();
  if (expired) {
    throw new ForbiddenError("This drop folder's deadline has passed.");
  }

  e.next();
}, "submissions");

// ---------------------------------------------------------------------
// Sanity check when a teacher creates a folder: deadline must be
// in the future.
// ---------------------------------------------------------------------
onRecordCreateRequest((e) => {
  const deadline = e.record.getDateTime("deadline");
  if (deadline.unix() <= Math.floor(Date.now() / 1000)) {
    throw new BadRequestError("Deadline must be in the future.");
  }
  e.next();
}, "folders");
