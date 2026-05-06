/// <reference path="../pb_data/types.d.ts" />

// Demo seed: one operator + one scheme per list type, owned by that operator.
// Lets you log in and click around without manual admin setup.
//
// Login credentials:
//   email:    operator@wp4trust.local
//   password: demo-pass-12345
//
// Delete or skip this file in production.

migrate((db) => {
  const dao = new Dao(db);

  // ─────────────── operator (idempotent) ───────────────
  const operatorsCol = dao.findCollectionByNameOrId("operators");
  let op;
  try {
    op = dao.findAuthRecordByEmail("operators", "operator@wp4trust.local");
  } catch (_) {
    op = new Record(operatorsCol);
    op.setUsername("demo_operator");
    op.setEmail("operator@wp4trust.local");
    op.setPassword("demo-pass-12345");
    op.setVerified(true);
    op.set("display_name", "Demo Operator");
    op.set("territory",    "EU");
    op.set("role",         "publisher");
    dao.saveRecord(op);
  }

  // ─────────────── one scheme per list type ───────────────
  const schemesCol = dao.findCollectionByNameOrId("schemes");

  const SCHEMES = [
    { list_type: "pid",       label: "EU PID Providers List",        type_uri: "http://uri.etsi.org/19602/LoTEType/EUPIDProvidersList" },
    { list_type: "wallet",    label: "EU Wallet Providers List",     type_uri: "http://uri.etsi.org/19602/LoTEType/EUWalletProvidersList" },
    { list_type: "pubeaa",    label: "EU PubEAA Providers List",     type_uri: "http://uri.etsi.org/19602/LoTEType/EUPubEAAProvidersList" },
    { list_type: "wrpac",     label: "EU WRPAC Providers List",      type_uri: "http://uri.etsi.org/19602/LoTEType/EUWRPACProvidersList" },
    { list_type: "wrprc",     label: "EU WRPRC Providers List",      type_uri: "http://uri.etsi.org/19602/LoTEType/EUWRPRCProvidersList" },
    { list_type: "registrar", label: "EU Registrars and Registers",  type_uri: "http://uri.etsi.org/19602/LoTEType/EURegistrarsAndRegistersList" },
    { list_type: "lotl",      label: "EU List of Trusted Lists",     type_uri: "http://uri.etsi.org/19602/LoTLType/EUListOfTrustedLists" },
  ];

  SCHEMES.forEach((s) => {
    const existing = dao.findRecordsByFilter(
      "schemes", `list_type = "${s.list_type}" && territory = "EU"`, "", 1, 0,
    );
    if (existing.length > 0) return;
    const rec = new Record(schemesCol);
    rec.set("list_type",       s.list_type);
    rec.set("operator_names", [{ language: "en", value: "WP4Trust Demo Registry" }]);
    rec.set("scheme_name",    [{ language: "en", value: s.label }]);
    rec.set("scheme_type",     s.type_uri);
    rec.set("territory",       "EU");
    rec.set("sequence_number", 1);
    rec.set("owner",           op.id);
    dao.saveRecord(rec);
  });
}, (db) => {
  const dao = new Dao(db);
  try {
    const op = dao.findAuthRecordByEmail("operators", "operator@wp4trust.local");
    const schemes = dao.findRecordsByFilter("schemes", `owner = "${op.id}"`, "", 100, 0);
    schemes.forEach((s) => dao.deleteRecord(s));
    dao.deleteRecord(op);
  } catch (_) { /* ignore */ }
});
