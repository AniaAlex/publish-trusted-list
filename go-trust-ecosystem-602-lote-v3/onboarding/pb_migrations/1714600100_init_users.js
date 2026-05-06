/// <reference path="../pb_data/types.d.ts" />

// Operators: end-user accounts (separate from PB super-admins).
// They log in via the public site, see their schemes, add/edit entities,
// trigger publish.

migrate((db) => {
  const dao = new Dao(db);

  const operators = new Collection({
    id: "col_operators___",
    name: "operators",
    type: "auth",
    schema: [
      {
        id: "fld_op_name___",
        name: "display_name",
        type: "text",
        required: true,
        options: { min: 1, max: 100 },
      },
      {
        id: "fld_op_terr__",
        name: "territory",
        type: "text",
        required: true,
        options: { min: 2, max: 3 },
      },
      {
        id: "fld_op_role__",
        name: "role",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["editor", "publisher", "viewer"],
        },
      },
    ],
    options: {
      allowEmailAuth: true,
      allowOAuth2Auth: false,
      allowUsernameAuth: false,
      requireEmail: true,
      onlyEmailDomains: null,
      minPasswordLength: 8,
    },
    listRule:   "id = @request.auth.id",
    viewRule:   "id = @request.auth.id",
    createRule: null,                      // admins create operators
    updateRule: "id = @request.auth.id",
    deleteRule: null,
  });
  dao.saveCollection(operators);

  // Add operator FK to schemes so we can scope "your schemes"
  const schemes = dao.findCollectionByNameOrId("schemes");
  schemes.schema.addField(new SchemaField({
    id: "fld_sch_owner_",
    name: "owner",
    type: "relation",
    required: false,
    options: {
      collectionId: "col_operators___",
      cascadeDelete: false,
      maxSelect: 1,
    },
  }));
  schemes.listRule   = '@request.auth.id != "" && (owner = @request.auth.id || @request.auth.collectionName = "_pb_users_auth_")';
  schemes.viewRule   = schemes.listRule;
  schemes.updateRule = schemes.listRule;
  schemes.deleteRule = schemes.listRule;
  dao.saveCollection(schemes);

  // Same scoping on entities (via scheme.owner)
  const entities = dao.findCollectionByNameOrId("entities");
  entities.listRule   = '@request.auth.id != "" && scheme.owner = @request.auth.id';
  entities.viewRule   = entities.listRule;
  entities.createRule = entities.listRule;
  entities.updateRule = entities.listRule;
  entities.deleteRule = entities.listRule;
  dao.saveCollection(entities);
}, (db) => {
  const dao = new Dao(db);
  try { dao.deleteCollection(dao.findCollectionByNameOrId("operators")); } catch (_) {}
});
