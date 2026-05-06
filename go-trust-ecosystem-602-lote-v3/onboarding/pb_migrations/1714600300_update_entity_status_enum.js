/// <reference path="../pb_data/types.d.ts" />

// Per ETSI TS 119 602 Annex H, the PubEAA-only `status` field uses
// notified/withdrawn rather than granted/withdrawn (which is the QTSP/TS 119 612
// vocabulary). Update the enum on the existing entities collection.

migrate((db) => {
  const dao = new Dao(db);
  const col = dao.findCollectionByNameOrId("entities");
  const field = col.schema.getFieldByName("status");
  field.options = {
    maxSelect: 1,
    values: [
      "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/notified",
      "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/withdrawn",
    ],
  };
  dao.saveCollection(col);
}, (db) => {
  const dao = new Dao(db);
  const col = dao.findCollectionByNameOrId("entities");
  const field = col.schema.getFieldByName("status");
  field.options = {
    maxSelect: 1,
    values: [
      "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/granted",
      "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/withdrawn",
    ],
  };
  dao.saveCollection(col);
});
