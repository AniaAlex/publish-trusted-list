/// <reference path="../pb_data/types.d.ts" />

// Initial schema for the LoTE onboarding app.
// Mirrors the YAML files the g119612 pipeline reads:
//   schemes        ↔ scheme.yaml / lotl.yaml
//   entities       ↔ entities/<name>/entity.yaml + cert.pem + *.jwk
//   lotl_pointers  ↔ lotl.yaml#pointers[]

migrate((db) => {
  const dao = new Dao(db);

  // ─────────────── schemes ───────────────
  const schemes = new Collection({
    id: "col_schemes_____",
    name: "schemes",
    type: "base",
    schema: [
      {
        id: "fld_list_type_",
        name: "list_type",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: [
            "pid", "wallet", "pubeaa",
            "wrpac", "wrprc", "registrar", "lotl",
          ],
        },
      },
      {
        id: "fld_op_names__",
        name: "operator_names",
        type: "json",
        required: true,
        options: { maxSize: 4000 },
      },
      {
        id: "fld_sch_name__",
        name: "scheme_name",
        type: "json",
        options: { maxSize: 4000 },
      },
      {
        id: "fld_sch_type__",
        name: "scheme_type",
        type: "url",
        required: true,
      },
      {
        id: "fld_territory_",
        name: "territory",
        type: "text",
        required: true,
        options: { min: 2, max: 3 },
      },
      {
        id: "fld_seq_num___",
        name: "sequence_number",
        type: "number",
        required: true,
        options: { min: 1 },
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_schemes_type_territory ON schemes (list_type, territory)",
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  dao.saveCollection(schemes);

  // ─────────────── entities ───────────────
  const entities = new Collection({
    id: "col_entities____",
    name: "entities",
    type: "base",
    schema: [
      {
        id: "fld_ent_scheme",
        name: "scheme",
        type: "relation",
        required: true,
        options: {
          collectionId: "col_schemes_____",
          cascadeDelete: false,
          maxSelect: 1,
        },
      },
      {
        id: "fld_ent_names_",
        name: "names",
        type: "json",
        required: true,
        options: { maxSize: 4000 },
      },
      {
        id: "fld_ent_id____",
        name: "entity_id",
        type: "url",
        required: true,
      },
      {
        id: "fld_ent_type__",
        name: "entity_type",
        type: "select",
        options: {
          maxSelect: 1,
          values: [
            "pid-provider", "wallet-provider", "pubeaa-provider",
            "wrpac-provider", "wrprc-provider", "registrar",
          ],
        },
      },
      {
        id: "fld_ent_status",
        name: "status",
        type: "select",
        options: {
          // PubEAA only — per ETSI TS 119 602 Annex H this becomes the ServiceStatus
          // in the output (notified/withdrawn). Other list types ignore this field.
          maxSelect: 1,
          values: [
            "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/notified",
            "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/withdrawn",
          ],
        },
      },
      {
        id: "fld_ent_addr__",
        name: "address",
        type: "json",
        options: { maxSize: 8000 },
      },
      {
        id: "fld_ent_infouri",
        name: "information_uri",
        type: "json",
        options: { maxSize: 4000 },
      },
      {
        id: "fld_ent_servic",
        name: "services",
        type: "json",
        required: true,
        options: { maxSize: 16000 },
      },
      {
        id: "fld_ent_cert__",
        name: "cert_pem",
        type: "file",
        options: {
          maxSelect: 5,
          maxSize: 1048576, // 1 MB
          mimeTypes: ["application/x-pem-file", "application/x-x509-ca-cert", "text/plain"],
        },
      },
      {
        id: "fld_ent_jwk___",
        name: "jwk",
        type: "json",
        options: { maxSize: 4000 },
      },
      {
        id: "fld_ent_did___",
        name: "did_uri",
        type: "url",
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_entities_scheme_entid ON entities (scheme, entity_id)",
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  dao.saveCollection(entities);

  // ─────────────── lotl_pointers ───────────────
  const pointers = new Collection({
    id: "col_lotl_ptrs__",
    name: "lotl_pointers",
    type: "base",
    schema: [
      {
        id: "fld_ptr_scheme",
        name: "scheme",
        type: "relation",
        required: true,
        options: {
          collectionId: "col_schemes_____",
          cascadeDelete: true,
          maxSelect: 1,
        },
      },
      {
        id: "fld_ptr_loc___",
        name: "location",
        type: "url",
        required: true,
      },
      {
        id: "fld_ptr_terr__",
        name: "scheme_territory",
        type: "text",
        required: true,
        options: { min: 2, max: 3 },
      },
      {
        id: "fld_ptr_type__",
        name: "scheme_type",
        type: "url",
        required: true,
      },
      {
        id: "fld_ptr_opnms_",
        name: "scheme_operator_names",
        type: "json",
        options: { maxSize: 4000 },
      },
      {
        id: "fld_ptr_mime__",
        name: "mime_type",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["application/json", "application/xml"],
        },
      },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
  });
  dao.saveCollection(pointers);

  // ─────────────── publish_runs (audit) ───────────────
  const publishRuns = new Collection({
    id: "col_pub_runs___",
    name: "publish_runs",
    type: "base",
    schema: [
      {
        id: "fld_pr_scheme_",
        name: "scheme",
        type: "relation",
        required: true,
        options: {
          collectionId: "col_schemes_____",
          cascadeDelete: false,
          maxSelect: 1,
        },
      },
      {
        id: "fld_pr_status_",
        name: "status",
        type: "select",
        required: true,
        options: {
          maxSelect: 1,
          values: ["pending", "running", "succeeded", "failed"],
        },
      },
      {
        id: "fld_pr_payload",
        name: "request_payload",
        type: "json",
        options: { maxSize: 1048576 },
      },
      {
        id: "fld_pr_resp___",
        name: "response",
        type: "json",
        options: { maxSize: 1048576 },
      },
      {
        id: "fld_pr_lote_js",
        name: "lote_json",
        type: "file",
        options: { maxSelect: 1, maxSize: 1048576 },
      },
      {
        id: "fld_pr_lote_jw",
        name: "lote_jws",
        type: "file",
        options: { maxSelect: 1, maxSize: 1048576 },
      },
      {
        id: "fld_pr_lote_xm",
        name: "lote_xml",
        type: "file",
        options: { maxSelect: 1, maxSize: 1048576 },
      },
    ],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: null, // immutable audit log
  });
  dao.saveCollection(publishRuns);
}, (db) => {
  const dao = new Dao(db);
  ["publish_runs", "lotl_pointers", "entities", "schemes"].forEach((name) => {
    try {
      dao.deleteCollection(dao.findCollectionByNameOrId(name));
    } catch (_) { /* ignore missing */ }
  });
});
