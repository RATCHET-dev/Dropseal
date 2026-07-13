/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // -------------------------------------------------------------
  // 1) teachers  (auth collection)
  // -------------------------------------------------------------
  const teachers = new Collection({
    type: "auth",
    name: "teachers",
    createRule: "", // anyone can register a teacher account
    listRule: "id = @request.auth.id",
    viewRule: "id = @request.auth.id",
    updateRule: "id = @request.auth.id",
    deleteRule: "id = @request.auth.id",
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        max: 120,
      },
    ],
    passwordAuth: {
      enabled: true,
      identityFields: ["email"],
    },
  });
  app.save(teachers);

  // -------------------------------------------------------------
  // 2) folders  (base collection, one per drop folder)
  // -------------------------------------------------------------
  const folders = new Collection({
    type: "base",
    name: "folders",
    listRule: "teacher = @request.auth.id",
    viewRule: "teacher = @request.auth.id",
    createRule: "@request.auth.id != '' && teacher = @request.auth.id",
    updateRule: "teacher = @request.auth.id",
    deleteRule: "teacher = @request.auth.id",
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        max: 150,
      },
      {
        name: "teacher",
        type: "relation",
        required: true,
        collectionId: teachers.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      {
        name: "password",
        type: "text",
        required: true,
        min: 4,
        max: 100,
      },
      {
        name: "deadline",
        type: "date",
        required: true,
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
      },
      {
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true,
      },
    ],
  });
  app.save(folders);

  // -------------------------------------------------------------
  // 3) submissions  (one per uploaded student submission)
  // -------------------------------------------------------------
  const submissions = new Collection({
    type: "base",
    name: "submissions",
    listRule: "folder.teacher = @request.auth.id",
    viewRule: "folder.teacher = @request.auth.id",
    createRule: "", // gate handled by onRecordCreateRequest hook (password + deadline token)
    updateRule: null,
    deleteRule: "folder.teacher = @request.auth.id",
    fields: [
      {
        name: "folder",
        type: "relation",
        required: true,
        collectionId: folders.id,
        cascadeDelete: true,
        maxSelect: 1,
      },
      {
        name: "student_name",
        type: "text",
        required: true,
        max: 150,
      },
      {
        name: "files",
        type: "file",
        required: true,
        maxSelect: 10,
        maxSize: 52428800, // 50MB per file
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
      },
    ],
  });
  app.save(submissions);
}, (app) => {
  // down migration: remove in reverse dependency order
  const submissions = app.findCollectionByNameOrId("submissions");
  if (submissions) app.delete(submissions);

  const folders = app.findCollectionByNameOrId("folders");
  if (folders) app.delete(folders);

  const teachers = app.findCollectionByNameOrId("teachers");
  if (teachers) app.delete(teachers);
});
