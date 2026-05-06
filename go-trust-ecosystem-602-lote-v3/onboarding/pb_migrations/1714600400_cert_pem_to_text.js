/// <reference path="../pb_data/types.d.ts" />

// PocketBase v0.22 JS hooks don't expose RecordUpsert, so dao.saveRecord
// can't persist multipart file uploads. Pivot: store cert as PEM text.
// The browser reads the .pem client-side via FileReader and submits as text.
// Downstream the Go publisher needs the PEM string anyway.

migrate((db) => {
  const dao = new Dao(db);
  const col = dao.findCollectionByNameOrId("entities");
  const idx = col.schema.fields().findIndex((f) => f.name === "cert_pem");
  if (idx < 0) return;
  col.schema.removeField(col.schema.fields()[idx].id);
  col.schema.addField(new SchemaField({
    id: "fld_ent_cert__",
    name: "cert_pem",
    type: "text",
    required: false,
    options: { max: 100000 },  // ~100 KB; one cert is typically 1-5 KB
  }));
  dao.saveCollection(col);
}, (db) => {
  const dao = new Dao(db);
  const col = dao.findCollectionByNameOrId("entities");
  const idx = col.schema.fields().findIndex((f) => f.name === "cert_pem");
  if (idx >= 0) col.schema.removeField(col.schema.fields()[idx].id);
  col.schema.addField(new SchemaField({
    id: "fld_ent_cert__",
    name: "cert_pem",
    type: "file",
    options: {
      maxSelect: 5,
      maxSize: 1048576,
      mimeTypes: ["application/x-pem-file", "application/x-x509-ca-cert", "text/plain"],
    },
  }));
  dao.saveCollection(col);
});
