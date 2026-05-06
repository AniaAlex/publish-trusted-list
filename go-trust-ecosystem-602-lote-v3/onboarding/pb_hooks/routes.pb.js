/// <reference path="../pb_data/types.d.ts" />

// Public-facing routes. Helpers live in _lib.js — required INSIDE each
// handler because PB hook handlers run in isolated runtimes that don't
// share module-scope state.

routerAdd("GET", "/", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  return h.redirect(c, h.currentOperator(c) ? "/dashboard" : "/login");
});

// ─────────────── public trust-list endpoints ───────────────
//
// These are the URLs verifiers (or the signer) will hit. No auth.
// Generated on the fly from the latest DB state — always fresh.
//
//   GET /lists/                                        → directory index (HTML)
//   GET /lists/index.json                              → JSON list of all schemes
//   GET /lists/<basename>-<territory>.json             → unsigned LoTE / LoTL
//
// Examples:
//   GET /lists/pid-EU.json
//   GET /lists/wallet-EU.json
//   GET /lists/pubeaa-EU.json
//   GET /lists/wrpac-EU.json
//   GET /lists/wrprc-EU.json
//   GET /lists/registrars-EU.json
//   GET /lists/list_of_trusted_lists-EU.json

routerAdd("GET", "/lists/index.json", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const schemes = $app.dao().findRecordsByFilter("schemes", 'id != ""', "+list_type", 200, 0);
  const items = schemes.map((s) => {
    const lt = s.getString("list_type");
    const basename = h.LIST_BASENAME[lt] || lt;
    const territory = s.getString("territory");
    return {
      list_type: lt,
      territory,
      url: `/lists/${basename}-${territory}.json`,
    };
  });
  c.response().header().set("Content-Type", "application/json; charset=utf-8");
  c.response().header().set("Cache-Control", "no-store");
  return c.string(200, JSON.stringify({ lists: items }, null, 2));
});

routerAdd("GET", "/lists/:filename", (c) => {
  const h = require(`${__hooks}/_lib.js`);

  const filename = c.pathParam("filename");
  // Accept lowercase territory too — normalize to upper for lookup.
  const m = /^(.+)-([A-Za-z]{2,3})\.json$/.exec(filename);
  if (!m) return c.json(404, { error: "not_found", filename });
  const basename = m[1].toLowerCase();
  const territory = m[2].toUpperCase();
  const listType = h.BASENAME_TO_LIST[basename];
  if (!listType) return c.json(404, { error: "unknown_list_type", basename });

  let scheme;
  try {
    const found = $app.dao().findRecordsByFilter(
      "schemes",
      `list_type = "${listType}" && territory = "${territory}"`,
      "", 1, 0,
    );
    if (found.length === 0) return c.json(404, { error: "scheme_not_found", listType, territory });
    scheme = found[0];
  } catch (err) {
    return c.json(500, { error: "lookup_failed", message: err.toString() });
  }

  const payload = h.buildEtsiLoTE($app.dao(), scheme);
  c.response().header().set("Content-Type", "application/json; charset=utf-8");
  c.response().header().set("Cache-Control", "no-store");
  return c.string(200, JSON.stringify(payload, null, 2));
});

routerAdd("GET", "/lists/", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const schemes = $app.dao().findRecordsByFilter("schemes", 'id != ""', "+list_type", 200, 0);
  let html = "<!DOCTYPE html><html><head><title>WP4Trust Trusted Lists</title>";
  html += '<link rel="stylesheet" href="/static/style.css"></head><body>';
  html += '<main class="container"><h1>WP4Trust trusted lists</h1>';
  html += '<p class="muted">Public unsigned LoTE / LoTL endpoints.</p>';
  html += '<table class="grid"><thead><tr><th>List type</th><th>Territory</th><th>URL</th></tr></thead><tbody>';
  schemes.forEach((s) => {
    const lt = s.getString("list_type");
    const basename = h.LIST_BASENAME[lt] || lt;
    const territory = s.getString("territory");
    const url = `/lists/${basename}-${territory}.json`;
    html += `<tr><td>${lt}</td><td>${territory}</td><td><a href="${url}"><code>${url}</code></a></td></tr>`;
  });
  html += '</tbody></table>';
  html += `<p class="muted"><a href="/lists/index.json">/lists/index.json</a> — machine-readable manifest.</p>`;
  html += '</main></body></html>';
  return c.html(200, html);
});

routerAdd("GET", "/login", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  return h.render(c, ["login.html"], {
    Title: "Log in",
    FormData: { email: "" },
  });
});

routerAdd("POST", "/login", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const email    = c.request().formValue("email");
  const password = c.request().formValue("password");

  let op;
  try {
    op = $app.dao().findAuthRecordByEmail("operators", email);
  } catch (_) {
    return h.render(c, ["login.html"], {
      Title: "Log in",
      FormData: { email },
      Errors: { credentials: "Email or password is incorrect." },
    });
  }
  if (!op.validatePassword(password)) {
    return h.render(c, ["login.html"], {
      Title: "Log in",
      FormData: { email },
      Errors: { credentials: "Email or password is incorrect." },
    });
  }

  const token = $tokens.recordAuthToken($app, op);
  c.response().header().add(
    "Set-Cookie",
    `${h.COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  );
  return h.redirect(c, "/dashboard");
});

routerAdd("GET", "/logout", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  c.response().header().add(
    "Set-Cookie",
    `${h.COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
  return h.redirect(c, "/login");
});

routerAdd("GET", "/dashboard", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const op = h.currentOperator(c);
  if (!op) return h.redirect(c, "/login");

  const schemes = $app.dao().findRecordsByFilter(
    "schemes", `owner = "${op.id}"`, "+list_type", 200, 0,
  );

  const rows = schemes.map((s) => {
    const ents = $app.dao().findRecordsByFilter(
      "entities", `scheme = "${s.id}"`, "", 5000, 0,
    );
    return {
      ID:             s.id,
      ListType:       s.getString("list_type"),
      ListTypeLabel:  h.LIST_TYPE_LABELS[s.getString("list_type")] || s.getString("list_type"),
      Territory:      s.getString("territory"),
      SequenceNumber: s.getInt("sequence_number"),
      EntityCount:    ents.length,
    };
  });

  return h.render(c, ["dashboard.html"], {
    Title:    "Dashboard",
    Operator: h.operatorView(op),
    Schemes:  rows,
  });
});

routerAdd("GET", "/schemes/:id", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const op = h.currentOperator(c);
  if (!op) return h.redirect(c, "/login");

  const scheme = $app.dao().findRecordById("schemes", c.pathParam("id"));
  if (scheme.getString("owner") !== op.id) return c.html(403, "forbidden");

  const lt = scheme.getString("list_type");
  const isLotl = lt === "lotl";

  const schemeView = {
    ID:             scheme.id,
    ListTypeLabel:  h.LIST_TYPE_LABELS[lt],
    Territory:      scheme.getString("territory"),
    SequenceNumber: scheme.getInt("sequence_number"),
    IsLoTL:         isLotl,
  };

  const ctx = {
    Title:    h.LIST_TYPE_LABELS[lt],
    Operator: h.operatorView(op),
    Scheme:   schemeView,
  };

  if (isLotl) {
    const ptrs = $app.dao().findRecordsByFilter(
      "lotl_pointers", `scheme = "${scheme.id}"`, "+scheme_territory", 500, 0,
    );
    ctx.Pointers = ptrs.map((p) => {
      const t = p.getString("scheme_type");
      return {
        ID:              p.id,
        Location:        p.getString("location"),
        SchemeTerritory: p.getString("scheme_territory"),
        SchemeType:      t,
        SchemeTypeShort: t.replace(/^.*\//, ""),
        MimeType:        p.getString("mime_type"),
      };
    });
  } else {
    const ents = $app.dao().findRecordsByFilter(
      "entities", `scheme = "${scheme.id}"`, "+entity_id", 1000, 0,
    );
    ctx.Entities = ents.map((e) => {
      const names = e.get("names") || [];
      return {
        ID:          e.id,
        PrimaryName: (names[0] && names[0].value) || "(unnamed)",
        EntityID:    e.getString("entity_id"),
        EntityType:  e.getString("entity_type"),
        Status:      e.getString("status") || "—",
      };
    });
  }

  return h.render(c, ["scheme_detail.html"], ctx);
});

routerAdd("GET", "/schemes/:id/entities/new", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const op = h.currentOperator(c);
  if (!op) return h.redirect(c, "/login");

  const scheme = $app.dao().findRecordById("schemes", c.pathParam("id"));
  if (scheme.getString("owner") !== op.id) return c.html(403, "forbidden");
  if (scheme.getString("list_type") === "lotl") return h.redirect(c, `/schemes/${scheme.id}/pointers/new`);

  const lt = scheme.getString("list_type");

  const PLACEHOLDERS = {
    pid:       { entity_id: "https://eid.example.se/pid",       info_uri: "https://www.example.se/eid",        electronic: "https://www.example.se",       service_name: "Example PID Issuance Service" },
    wallet:    { entity_id: "https://wallet.example.se",         info_uri: "https://www.example.se/wallet",     electronic: "https://www.example.se",       service_name: "Example Wallet Solution" },
    pubeaa:    { entity_id: "https://eaa.example.se",            info_uri: "https://www.example.se/eaa",        electronic: "https://www.example.se",       service_name: "Example PubEAA Issuance Service" },
    wrpac:     { entity_id: "https://wrpac.example.se",          info_uri: "https://www.example.se/wrpac",      electronic: "https://www.example.se",       service_name: "Example WRPAC Service" },
    wrprc:     { entity_id: "https://wrprc.example.se",          info_uri: "https://www.example.se/wrprc",      electronic: "https://www.example.se",       service_name: "Example WRPRC Service" },
    registrar: { entity_id: "https://eregister.example.se",      info_uri: "https://www.example.se/registrar",  electronic: "https://www.example.se",       service_name: "Example Registrar Service" },
  };

  return h.render(c, ["entity_form.html"], {
    Title:    "Add entity",
    Operator: h.operatorView(op),
    Scheme: {
      ID:             scheme.id,
      ListTypeLabel:  h.LIST_TYPE_LABELS[lt],
      Territory:      scheme.getString("territory"),
    },
    Entity:           {},
    ServiceTypeLabel: h.SERVICE_TYPE_LABELS[lt] || "",
    ShowStatus:       lt === "pubeaa",
    Placeholders:     PLACEHOLDERS[lt] || PLACEHOLDERS.pid,
    FormData: {
      entity_id: "", status: "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/notified",
      names: [],
      addr_street: "", addr_city: "", addr_postal: "",
      addr_country: scheme.getString("territory"),
      electronic: [], informationURI: [],
      service_names: [],
      jwk_text: "", did_uri: "", cert_pem: "",
    },
  });
});

routerAdd("POST", "/schemes/:id/entities/new", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const op = h.currentOperator(c);
  if (!op) return h.redirect(c, "/login");

  const scheme = $app.dao().findRecordById("schemes", c.pathParam("id"));
  if (scheme.getString("owner") !== op.id) return c.html(403, "forbidden");

  const req = c.request();
  // multipart needs explicit parse; for url-encoded parseForm is enough.
  try { req.parseMultipartForm(32 * 1024 * 1024); } catch (_) { try { req.parseForm(); } catch (_) {} }
  const formMap = (req.multipartForm && req.multipartForm.value)
    ? req.multipartForm.value
    : (req.postForm || req.form || {});

  const arr = (k) => {
    const v = formMap[k];
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  };

  // ─── parse multilang repeater fields ───
  const pairs = (langKey, valKey) => {
    const langs  = arr(langKey);
    const values = arr(valKey);
    const out = [];
    for (let i = 0; i < langs.length; i++) {
      if (langs[i] && values[i]) out.push({ language: langs[i], value: values[i] });
    }
    return out;
  };
  const list = (key) => arr(key).filter((v) => !!v);

  const names          = pairs("names_lang[]",   "names_value[]");
  const informationURI = pairs("info_lang[]",    "info_value[]");
  const serviceNames   = pairs("svcname_lang[]", "svcname_value[]");
  const electronic     = list("electronic[]");

  // ─── address ───
  const address = {
    postal: {
      streetAddress: req.formValue("addr_street"),
      locality:      req.formValue("addr_city"),
      postalCode:    req.formValue("addr_postal"),
      countryName:   req.formValue("addr_country"),
    },
  };
  if (electronic.length > 0) address.electronic = electronic;

  // ─── single service ───
  // - serviceType derived from scheme.list_type
  // - status: PubEAA mirrors the entity's notified/withdrawn (ETSI 119 602 Annex H);
  //   other profiles use implicit trust → fill with granted as a placeholder
  const lt = scheme.getString("list_type");
  const entityStatus = req.formValue("status") || "";
  const serviceStatus = (lt === "pubeaa")
    ? (entityStatus || h.SVCSTATUS_NOTIFIED)
    : h.SVCSTATUS_GRANTED;
  const services = [{
    serviceNames: serviceNames,
    serviceType:  h.LIST_TYPE_TO_SERVICE_TYPE[lt] || "",
    status:       serviceStatus,
  }];

  // ─── build the record ───
  const collection = $app.dao().findCollectionByNameOrId("entities");
  const rec = new Record(collection);
  rec.set("scheme",          scheme.id);
  rec.set("names",           names);
  rec.set("entity_id",       req.formValue("entity_id"));
  rec.set("entity_type",     h.LIST_TYPE_TO_ENTITY_TYPE[lt] || "");
  rec.set("status",          req.formValue("status") || "");
  rec.set("address",         address);
  rec.set("information_uri", informationURI);
  rec.set("services",        services);
  const did = req.formValue("did_uri");
  if (did) rec.set("did_uri", did);
  const jwk = h.tryParseJSON(req.formValue("jwk_text"));
  if (jwk) rec.set("jwk", jwk);

  // cert_pem is a text field (PEM contents). The browser reads the .pem
  // file client-side via FileReader and submits the text as a regular form field.
  const certText = req.formValue("cert_pem");
  if (certText) rec.set("cert_pem", certText);

  try { $app.dao().saveRecord(rec); }
  catch (err) { return c.html(400, "<pre>save failed:\n" + err.toString() + "</pre>"); }
  return h.redirect(c, `/schemes/${scheme.id}`);
});

// ─────────────── entity edit routes ───────────────

routerAdd("GET", "/schemes/:id/entities/:eid/edit", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const op = h.currentOperator(c);
  if (!op) return h.redirect(c, "/login");

  const scheme = $app.dao().findRecordById("schemes", c.pathParam("id"));
  if (scheme.getString("owner") !== op.id) return c.html(403, "forbidden");
  const ent = $app.dao().findRecordById("entities", c.pathParam("eid"));
  if (ent.getString("scheme") !== scheme.id) return c.html(404, "not in this scheme");

  const lt = scheme.getString("list_type");

  const PLACEHOLDERS = {
    pid:       { entity_id: "https://eid.example.se/pid",   info_uri: "https://www.example.se/eid",       electronic: "https://www.example.se", service_name: "Example PID Issuance Service" },
    wallet:    { entity_id: "https://wallet.example.se",     info_uri: "https://www.example.se/wallet",    electronic: "https://www.example.se", service_name: "Example Wallet Solution" },
    pubeaa:    { entity_id: "https://eaa.example.se",        info_uri: "https://www.example.se/eaa",       electronic: "https://www.example.se", service_name: "Example PubEAA Issuance Service" },
    wrpac:     { entity_id: "https://wrpac.example.se",      info_uri: "https://www.example.se/wrpac",     electronic: "https://www.example.se", service_name: "Example WRPAC Service" },
    wrprc:     { entity_id: "https://wrprc.example.se",      info_uri: "https://www.example.se/wrprc",     electronic: "https://www.example.se", service_name: "Example WRPRC Service" },
    registrar: { entity_id: "https://eregister.example.se",  info_uri: "https://www.example.se/registrar", electronic: "https://www.example.se", service_name: "Example Registrar Service" },
  };

  // PB returns JSON fields as raw bytes; round-trip through JSON to get plain JS objects
  // that Go html/template can iterate as expected.
  const parseField = (k) => {
    const raw = ent.getString(k);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  };
  const names          = parseField("names")           || [];
  const addr           = parseField("address")         || {};
  const postal         = addr.postal                   || {};
  const services       = parseField("services")        || [];
  const svc0           = services[0]                   || {};
  const informationURI = parseField("information_uri") || [];
  const jwk            = parseField("jwk");

  return h.render(c, ["entity_form.html"], {
    Title:    "Edit entity",
    Operator: h.operatorView(op),
    Scheme: {
      ID:             scheme.id,
      ListTypeLabel:  h.LIST_TYPE_LABELS[lt],
      Territory:      scheme.getString("territory"),
    },
    Entity:           { ID: ent.id },
    ServiceTypeLabel: h.SERVICE_TYPE_LABELS[lt] || "",
    ShowStatus:       lt === "pubeaa",
    Placeholders:     PLACEHOLDERS[lt] || PLACEHOLDERS.pid,
    FormData: {
      entity_id:      ent.getString("entity_id"),
      status:         ent.getString("status"),
      names:          names,
      addr_street:    postal.streetAddress || "",
      addr_city:      postal.locality      || "",
      addr_postal:    postal.postalCode    || "",
      addr_country:   postal.countryName   || scheme.getString("territory"),
      electronic:     addr.electronic      || [],
      informationURI: informationURI,
      service_names:  svc0.serviceNames    || [],
      jwk_text:       jwk ? JSON.stringify(jwk) : "",
      did_uri:        ent.getString("did_uri"),
      cert_pem:       ent.getString("cert_pem"),
    },
  });
});

routerAdd("POST", "/schemes/:id/entities/:eid/edit", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const op = h.currentOperator(c);
  if (!op) return h.redirect(c, "/login");

  const scheme = $app.dao().findRecordById("schemes", c.pathParam("id"));
  if (scheme.getString("owner") !== op.id) return c.html(403, "forbidden");
  const rec = $app.dao().findRecordById("entities", c.pathParam("eid"));
  if (rec.getString("scheme") !== scheme.id) return c.html(404, "not in this scheme");

  const req = c.request();
  try { req.parseMultipartForm(32 * 1024 * 1024); } catch (_) { try { req.parseForm(); } catch (_) {} }
  const formMap = (req.multipartForm && req.multipartForm.value)
    ? req.multipartForm.value
    : (req.postForm || req.form || {});
  const arr = (k) => {
    const v = formMap[k];
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  };
  const pairs = (lk, vk) => {
    const ls = arr(lk), vs = arr(vk), out = [];
    for (let i = 0; i < ls.length; i++) {
      if (ls[i] && vs[i]) out.push({ language: ls[i], value: vs[i] });
    }
    return out;
  };
  const list = (k) => arr(k).filter((v) => !!v);

  const lt = scheme.getString("list_type");
  const entityStatus = req.formValue("status") || "";
  const serviceStatus = (lt === "pubeaa")
    ? (entityStatus || h.SVCSTATUS_NOTIFIED)
    : h.SVCSTATUS_GRANTED;

  const electronic = list("electronic[]");
  const address = {
    postal: {
      streetAddress: req.formValue("addr_street"),
      locality:      req.formValue("addr_city"),
      postalCode:    req.formValue("addr_postal"),
      countryName:   req.formValue("addr_country"),
    },
  };
  if (electronic.length > 0) address.electronic = electronic;

  rec.set("names",           pairs("names_lang[]",   "names_value[]"));
  rec.set("entity_id",       req.formValue("entity_id"));
  rec.set("entity_type",     h.LIST_TYPE_TO_ENTITY_TYPE[lt] || "");
  rec.set("status",          entityStatus);
  rec.set("address",         address);
  rec.set("information_uri", pairs("info_lang[]", "info_value[]"));
  rec.set("services",        [{
    serviceNames: pairs("svcname_lang[]", "svcname_value[]"),
    serviceType:  h.LIST_TYPE_TO_SERVICE_TYPE[lt] || "",
    status:       serviceStatus,
  }]);
  const did = req.formValue("did_uri");
  rec.set("did_uri", did || "");
  const jwk = h.tryParseJSON(req.formValue("jwk_text"));
  rec.set("jwk", jwk || null);

  // cert_pem is a text field (PEM contents). The browser reads the .pem
  // file client-side via FileReader and submits the text as a regular form field.
  const certText = req.formValue("cert_pem");
  if (certText) rec.set("cert_pem", certText);

  try { $app.dao().saveRecord(rec); }
  catch (err) { return c.html(400, "<pre>save failed:\n" + err.toString() + "</pre>"); }
  return h.redirect(c, `/schemes/${scheme.id}`);
});

// ─────────────── LoTL pointer routes ───────────────

routerAdd("GET", "/schemes/:id/pointers/new", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const op = h.currentOperator(c);
  if (!op) return h.redirect(c, "/login");

  const scheme = $app.dao().findRecordById("schemes", c.pathParam("id"));
  if (scheme.getString("owner") !== op.id) return c.html(403, "forbidden");
  if (scheme.getString("list_type") !== "lotl") {
    return h.redirect(c, `/schemes/${scheme.id}/entities/new`);
  }

  const SCHEME_TYPE_OPTIONS = [
    { Value: "http://uri.etsi.org/19602/LoTEType/EUPIDProvidersList",       Label: "EU PID Providers" },
    { Value: "http://uri.etsi.org/19602/LoTEType/EUWalletProvidersList",    Label: "EU Wallet Providers" },
    { Value: "http://uri.etsi.org/19602/LoTEType/EUPubEAAProvidersList",    Label: "EU PubEAA Providers" },
    { Value: "http://uri.etsi.org/19602/LoTEType/EUWRPACProvidersList",     Label: "EU WRPAC Providers" },
    { Value: "http://uri.etsi.org/19602/LoTEType/EUWRPRCProvidersList",     Label: "EU WRPRC Providers" },
    { Value: "http://uri.etsi.org/19602/LoTEType/EURegistrarsAndRegistersList", Label: "EU Registrars and Registers" },
  ];

  return h.render(c, ["pointer_form.html"], {
    Title:    "Add pointer",
    Operator: h.operatorView(op),
    Scheme: {
      ID:             scheme.id,
      ListTypeLabel:  h.LIST_TYPE_LABELS["lotl"],
      Territory:      scheme.getString("territory"),
    },
    Pointer: {},
    SchemeTypeOptions: SCHEME_TYPE_OPTIONS,
    FormData: {
      location: "", scheme_territory: "", scheme_type: "",
      mime_type: "application/json", scheme_operator_names: [],
    },
  });
});

routerAdd("POST", "/schemes/:id/pointers/new", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const op = h.currentOperator(c);
  if (!op) return h.redirect(c, "/login");

  const scheme = $app.dao().findRecordById("schemes", c.pathParam("id"));
  if (scheme.getString("owner") !== op.id) return c.html(403, "forbidden");
  if (scheme.getString("list_type") !== "lotl") return c.html(400, "not a LoTL scheme");

  const req = c.request();
  const langs  = req.form().value["opnames_lang[]"]  || [];
  const values = req.form().value["opnames_value[]"] || [];
  const opNames = [];
  for (let i = 0; i < langs.length; i++) {
    if (langs[i] && values[i]) opNames.push({ language: langs[i], value: values[i] });
  }

  const collection = $app.dao().findCollectionByNameOrId("lotl_pointers");
  const rec = new Record(collection);
  rec.set("scheme",                scheme.id);
  rec.set("location",              req.formValue("location"));
  rec.set("scheme_territory",      req.formValue("scheme_territory"));
  rec.set("scheme_type",           req.formValue("scheme_type"));
  rec.set("scheme_operator_names", opNames);
  rec.set("mime_type",             req.formValue("mime_type"));

  try { $app.dao().saveRecord(rec); }
  catch (err) { return c.html(400, "save failed: " + err.toString()); }
  return h.redirect(c, `/schemes/${scheme.id}`);
});

routerAdd("POST", "/schemes/:id/publish", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const op = h.currentOperator(c);
  if (!op) return h.redirect(c, "/login");

  const scheme = $app.dao().findRecordById("schemes", c.pathParam("id"));
  if (scheme.getString("owner") !== op.id) return c.html(403, "forbidden");

  const collection = $app.dao().findCollectionByNameOrId("publish_runs");
  const rec = new Record(collection);
  rec.set("scheme", scheme.id);
  rec.set("status", "pending");
  $app.dao().saveRecord(rec);
  return h.redirect(c, `/schemes/${scheme.id}`);
});

// ─────────────── publish preview (debug) ───────────────
// Returns the JSON payload that would be POSTed to the Go publisher.
// Same shape as publish.pb.js builds, but without actually publishing.

routerAdd("GET", "/schemes/:id/preview", (c) => {
  const h = require(`${__hooks}/_lib.js`);
  const op = h.currentOperator(c);
  if (!op) return h.redirect(c, "/login");

  const scheme = $app.dao().findRecordById("schemes", c.pathParam("id"));
  if (scheme.getString("owner") !== op.id) return c.html(403, "forbidden");

  const payload = h.buildEtsiLoTE($app.dao(), scheme);
  c.response().header().set("Content-Type", "application/json; charset=utf-8");
  return c.string(200, JSON.stringify(payload, null, 2));
});

routerAdd("GET", "/partials/repeater-row", (c) => {
  const single = c.queryParam("single");
  if (single) {
    const html = `
      <div class="row">
        <input name="${single}[]" placeholder="value">
        <button type="button" class="btn ghost" onclick="this.closest('.row').remove()">×</button>
      </div>`;
    return c.html(200, html);
  }

  const fields = (c.queryParam("fields") || "").split(",");
  if (fields.length !== 2) return c.html(400, "bad fields");
  const html = `
    <div class="row">
      <input name="${fields[0]}[]" placeholder="lang">
      <input name="${fields[1]}[]" placeholder="value">
      <button type="button" class="btn ghost" onclick="this.closest('.row').remove()">×</button>
    </div>`;
  return c.html(200, html);
});
