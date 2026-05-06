/// <reference path="../pb_data/types.d.ts" />

// Triggered when an operator creates a publish_runs record.
// Builds a JSON payload from the related scheme + entities (or LoTL pointers)
// and POSTs it to the Go publisher service.
//
// The publisher URL comes from the PUBLISHER_URL env var (set in docker-compose).
// Until the publisher service is built, this hook logs the payload it would
// have sent and marks the run as "succeeded" with a note in `response`.

onRecordAfterCreateRequest((e) => {
  const run = e.record;
  const dao = $app.dao();

  run.set("status", "running");
  dao.saveRecord(run);

  const h = require(`${__hooks}/_lib.js`);
  let payload;
  try {
    const scheme = dao.findRecordById("schemes", run.getString("scheme"));
    payload = h.buildEtsiLoTE(dao, scheme);
  } catch (err) {
    run.set("status", "failed");
    run.set("response", { error: "build_payload: " + err.toString() });
    dao.saveRecord(run);
    return;
  }
  run.set("request_payload", payload);

  const publisherUrl = $os.getenv("PUBLISHER_URL");
  if (!publisherUrl) {
    run.set("status", "succeeded");
    run.set("response", {
      note: "PUBLISHER_URL not set — payload built but not sent. Wire the Go publisher to enable signing.",
      payload_size: JSON.stringify(payload).length,
    });
    dao.saveRecord(run);
    return;
  }

  // Both LoTE and LoTL profiles share the same wrapper now (LoTE root key);
  // the publisher distinguishes by ListAndSchemeInformation.LoTEType.
  let resp;
  try {
    resp = $http.send({
      url: publisherUrl + "/api/v1/sign",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      timeout: 30,
    });
  } catch (err) {
    run.set("status", "failed");
    run.set("response", { error: "http: " + err.toString() });
    dao.saveRecord(run);
    return;
  }

  if (resp.statusCode >= 200 && resp.statusCode < 300) {
    run.set("status", "succeeded");
    run.set("response", resp.json);
    // TODO: when publisher returns artefact bytes, attach them as files
    //       to lote_json / lote_jws / lote_xml fields.
  } else {
    run.set("status", "failed");
    run.set("response", { http_status: resp.statusCode, body: resp.raw });
  }
  dao.saveRecord(run);
}, "publish_runs");

// All payload-building logic lives in _lib.js (`buildEtsiLoTE`) so the
// preview route and the publish hook emit identical JSON.
