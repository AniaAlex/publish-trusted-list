// Shared helpers for routes.pb.js / publish.pb.js.
// NOT a *.pb.js file — won't be auto-loaded; requireable from handlers.
//
// Usage inside a routerAdd handler:
//   const h = require(`${__hooks}/_lib.js`);
//   return h.render(c, ["login.html"], data);

const COOKIE = "pb_op_token";

const LIST_TYPE_LABELS = {
  pid:       "EU PID Providers",
  wallet:    "EU Wallet Providers",
  pubeaa:    "EU PubEAA Providers",
  wrpac:     "EU WRPAC Providers",
  wrprc:     "EU WRPRC Providers",
  registrar: "EU Registrars and Registers",
  lotl:      "EU List of Trusted Lists",
};

const ENTITY_TYPE_OPTIONS_FOR_LIST = {
  pid:       [{ Value: "pid-provider",     Label: "PID Provider" }],
  wallet:    [{ Value: "wallet-provider",  Label: "Wallet Provider" }],
  pubeaa:    [{ Value: "pubeaa-provider",  Label: "PubEAA Provider" }],
  wrpac:     [{ Value: "wrpac-provider",   Label: "WRPAC Provider" }],
  wrprc:     [{ Value: "wrprc-provider",   Label: "WRPRC Provider" }],
  registrar: [{ Value: "registrar",        Label: "Registrar / EBWOID" }],
  lotl:      [],
};

// Each list type has exactly one entity type — pre-fill server-side.
const LIST_TYPE_TO_ENTITY_TYPE = {
  pid:       "pid-provider",
  wallet:    "wallet-provider",
  pubeaa:    "pubeaa-provider",
  wrpac:     "wrpac-provider",
  wrprc:     "wrprc-provider",
  registrar: "registrar",
};

// Service type per ETSI 119 602 §5.5.7 — one fixed URI per list type.
const LIST_TYPE_TO_SERVICE_TYPE = {
  pid:       "http://uri.etsi.org/19602/SvcType/PIDProvider",
  wallet:    "http://uri.etsi.org/19602/SvcType/WalletSolution/Issuance",
  pubeaa:    "http://uri.etsi.org/19602/SvcType/PubEAAProvider",
  wrpac:     "http://uri.etsi.org/19602/SvcType/WRPACProvider",
  wrprc:     "http://uri.etsi.org/19602/SvcType/WRPRCProvider",
  registrar: "http://uri.etsi.org/19602/SvcType/Registrar",
};

const SERVICE_TYPE_LABELS = {
  pid:       "PIDProvider",
  wallet:    "WalletSolution/Issuance",
  pubeaa:    "PubEAAProvider",
  wrpac:     "WRPACProvider",
  wrprc:     "WRPRCProvider",
  registrar: "Registrar",
};

const SVCSTATUS_GRANTED   = "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/granted";
const SVCSTATUS_WITHDRAWN = "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/withdrawn";
const SVCSTATUS_NOTIFIED  = "http://uri.etsi.org/TrstSvc/TrustedList/Svcstatus/notified";

// Filename basename per list type — matches existing output/<dir>/<basename>-<territory>.json
const LIST_BASENAME = {
  pid:       "pid",
  wallet:    "wallet",
  pubeaa:    "pubeaa",
  wrpac:     "wrpac",
  wrprc:     "wrprc",
  registrar: "registrars",
  lotl:      "list_of_trusted_lists",
};
const BASENAME_TO_LIST = Object.keys(LIST_BASENAME).reduce((acc, k) => {
  acc[LIST_BASENAME[k]] = k;
  return acc;
}, {});

function render(c, templates, data) {
  data.Title    = data.Title    || "WP4Trust";
  data.Flash    = data.Flash    || null;
  data.Errors   = data.Errors   || null;
  data.Operator = data.Operator || null;

  const html = $template.loadFiles(
    `${__hooks}/views/base.html`,
    ...templates.map((t) => `${__hooks}/views/${t}`),
  ).render(data);
  return c.html(200, html);
}

function readCookie(c, name) {
  try {
    const ck = c.request().cookie(name);
    return ck && ck.value ? ck.value : null;
  } catch (_) {
    return null;
  }
}

function currentOperator(c) {
  const token = readCookie(c, COOKIE);
  if (!token) return null;
  try {
    return $app.dao().findAuthRecordByToken(
      token, $app.settings().recordAuthToken.secret,
    );
  } catch (_) {
    return null;
  }
}

function redirect(c, path) {
  c.response().header().set("Location", path);
  c.response().writeHeader(302);
  return null;
}

function operatorView(op) {
  if (!op) return null;
  return {
    DisplayName: op.getString("display_name"),
    Territory:   op.getString("territory"),
    Role:        op.getString("role"),
  };
}

function tryParseJSON(s) {
  if (!s) return null;
  try { return JSON.parse(s); } catch (_) { return null; }
}

// Split a PEM blob into individual X.509 certs.
// Per ETSI 119 602 §5.5.5 each X509Certificate is its own DigitalId entry,
// so a chain (leaf + issuer + ...) must be split into N entries.
function splitPemChain(pem) {
  if (!pem) return [];
  const out = [];
  const re = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
  let m;
  while ((m = re.exec(pem)) !== null) {
    // Normalize CRLF → LF; trim any leading/trailing whitespace
    out.push(m[0].replace(/\r\n/g, "\n").trim());
  }
  return out;
}

// Strip PEM armor + whitespace → naked base64 DER, matching the
// `X509Certificates[].val` shape the existing pipeline emits.
function pemToBase64DER(pem) {
  return pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
}

// ────────────────────────────────────────────────────────────────────
// Build the canonical ETSI 119 602 LoTE / LoTL document for a scheme.
// Mirrors the shape produced by the existing g119612 pipeline, so the
// Go publisher only needs to add ListIssueDateTime / NextUpdate and sign.
//
// Conventions captured from output/*/lote-EU.json:
//   - PascalCase field names everywhere (LoTE, TrustedEntityInformation, …)
//   - {lang, value} for text values; {lang, uriValue} for URI values
//   - TEPostalAddress[i].lang = ""           (empty)
//   - TEElectronicAddress[i].lang = ""       (empty)
//   - TEInformationURI[i].lang = actual tag
//   - X509Certificates[].val = base64 DER (no PEM armor)
//   - PublicKeyValues[]      = JWK inlined as object
//   - ServiceStatus is present only on the PubEAA profile
//   - LoTL has PointersToOtherLoTE inside ListAndSchemeInformation,
//     no TrustedEntitiesList key at all
// ────────────────────────────────────────────────────────────────────
function buildEtsiLoTE(dao, scheme) {
  const parseJson = (raw) => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) { return null; }
  };
  const toMultiLang = (arr) => (arr || []).map((x) => ({
    lang:  x.language || x.lang || "",
    value: x.value    || "",
  }));
  const toMultiLangURI = (arr) => (arr || []).map((x) => ({
    lang:     x.language || x.lang || "",
    uriValue: x.value    || x.uriValue || "",
  }));

  const lt = scheme.getString("list_type");
  const isLotl = lt === "lotl";
  const isPubEAA = lt === "pubeaa";

  const info = {
    LoTEVersionIdentifier: 1,
    LoTESequenceNumber:    scheme.getInt("sequence_number") || 1,
    LoTEType:              scheme.getString("scheme_type"),
    SchemeOperatorName:    toMultiLang(parseJson(scheme.getString("operator_names"))),
    SchemeName:            toMultiLang(parseJson(scheme.getString("scheme_name"))),
    SchemeTerritory:       scheme.getString("territory"),
  };

  if (isLotl) {
    const ptrs = dao.findRecordsByFilter(
      "lotl_pointers", `scheme = "${scheme.id}"`, "+scheme_territory", 500, 0,
    );
    info.PointersToOtherLoTE = ptrs.map((p) => ({
      LoTELocation:             p.getString("location"),
      ServiceDigitalIdentities: null,
      LoTEQualifiers: [{
        LoTEType:           p.getString("scheme_type"),
        SchemeOperatorName: toMultiLang(parseJson(p.getString("scheme_operator_names"))),
        SchemeTerritory:    p.getString("scheme_territory"),
        MimeType:           p.getString("mime_type"),
      }],
    }));
    return { LoTE: { ListAndSchemeInformation: info } };
  }

  // Non-LoTL profiles: build TrustedEntitiesList
  const ents = dao.findRecordsByFilter(
    "entities", `scheme = "${scheme.id}"`, "+entity_id", 5000, 0,
  );

  const trustedEntities = ents.map((e) => {
    const address = parseJson(e.getString("address")) || {};
    const postal  = address.postal || {};
    const electronic = Array.isArray(address.electronic) ? address.electronic : [];
    const services = parseJson(e.getString("services")) || [];

    // ─── ServiceDigitalIdentity ───
    const certs = splitPemChain(e.getString("cert_pem"))
      .map((pem) => ({ val: pemToBase64DER(pem) }));
    const jwk = parseJson(e.getString("jwk"));
    const did = e.getString("did_uri");
    const sdi = {};
    if (certs.length > 0) sdi.X509Certificates = certs;
    if (jwk && Object.keys(jwk).length > 0) sdi.PublicKeyValues = [jwk];
    if (did) sdi.OtherIds = [did];
    const hasSDI = Object.keys(sdi).length > 0;

    // ─── TEAddress ───
    const teAddress = {};
    if (postal && (postal.streetAddress || postal.locality || postal.postalCode || postal.countryName)) {
      teAddress.TEPostalAddress = [{
        lang:          "",
        StreetAddress: postal.streetAddress || "",
        Locality:      postal.locality      || "",
        PostalCode:    postal.postalCode    || "",
        Country:       postal.countryName   || "",
      }];
    }
    if (electronic.length > 0) {
      teAddress.TEElectronicAddress = electronic.map((u) => ({ lang: "", uriValue: u }));
    }

    // ─── TrustedEntityServices ───
    const teServices = services.map((svc) => {
      const si = {
        ServiceName: toMultiLang(svc.serviceNames),
      };
      if (hasSDI) si.ServiceDigitalIdentity = sdi;
      si.ServiceTypeIdentifier = svc.serviceType;
      if (isPubEAA && svc.status) si.ServiceStatus = svc.status;
      return { ServiceInformation: si };
    });

    const tei = {
      TEName: toMultiLang(parseJson(e.getString("names"))),
    };
    if (Object.keys(teAddress).length > 0) tei.TEAddress = teAddress;
    const infoURIs = parseJson(e.getString("information_uri")) || [];
    if (infoURIs.length > 0) tei.TEInformationURI = toMultiLangURI(infoURIs);

    return {
      TrustedEntityInformation: tei,
      TrustedEntityServices:    teServices,
    };
  });

  return {
    LoTE: {
      ListAndSchemeInformation: info,
      TrustedEntitiesList:      trustedEntities,
    },
  };
}

module.exports = {
  COOKIE,
  LIST_TYPE_LABELS,
  ENTITY_TYPE_OPTIONS_FOR_LIST,
  LIST_TYPE_TO_ENTITY_TYPE,
  LIST_TYPE_TO_SERVICE_TYPE,
  SERVICE_TYPE_LABELS,
  SVCSTATUS_GRANTED,
  SVCSTATUS_WITHDRAWN,
  SVCSTATUS_NOTIFIED,
  LIST_BASENAME,
  BASENAME_TO_LIST,
  render,
  readCookie,
  currentOperator,
  redirect,
  operatorView,
  tryParseJSON,
  splitPemChain,
  pemToBase64DER,
  buildEtsiLoTE,
};
