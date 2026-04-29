// Demo: produce and sign all LoTE types using the g119612 pipeline functions.
//
// GenerateLoTE reads entities/<type>/ (scheme.yaml + entities/<name>/ subdirs).
// PublishLoTE validates, writes unsigned JSON + JAdES-B-B signed .jws + XAdES signed XML.
//
// Signing credentials: signing/operator.pem (cert) + signing/operator.key (EC private key).
// Each list type goes to its own output subdirectory to avoid filename collisions.
package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/sirosfoundation/g119612/pkg/pipeline"
)

const (
	signingCert = "signing/operator.pem"
	signingKey  = "signing/operator.key"
)

type listDef struct {
	dir     string
	outName string
}

func main() {
	lists := []listDef{
		{"entities/pid_providers",         "pid_providers"},
		{"entities/wallet_providers",      "wallet_providers"},
		{"entities/pubeaa_providers",      "pubeaa_providers"},
		{"entities/wrpac_providers",       "wrpac_providers"},
		{"entities/wrprc_providers",       "wrprc_providers"},
		{"entities/registrars_registers",  "registrars_registers"},
		{"entities/eu_lotl",               "eu_lotl"},
	}

	if err := os.MkdirAll("output", 0755); err != nil {
		fatal("create output dir", err)
	}

	for _, l := range lists {
		ctx := pipeline.NewContext()

		// GenerateLoTE auto-detects lotl.yaml → delegates to GenerateLoTL.
		ctx, err := pipeline.GenerateLoTE(nil, ctx, l.dir)
		if err != nil {
			fatal("generate "+l.outName, err)
		}

		// Each list gets its own subdirectory so lote-EU.json doesn't collide.
		outDir := filepath.Join("output", l.outName)

		// PublishLoTE:
		//   arg 1 — output directory
		//   arg 2 — operator signing certificate (PEM)
		//   arg 3 — operator signing private key  (PEM)
		//   "xml" — also produce XAdES-signed XML alongside JAdES-signed JSON
		ctx, err = pipeline.PublishLoTE(nil, ctx,
			outDir,
			signingCert,
			signingKey,
			"xml",
		)
		if err != nil {
			fatal("publish "+l.outName, err)
		}

		fmt.Printf("OK  %s/\n", outDir)
	}
}

func fatal(msg string, err error) {
	fmt.Fprintf(os.Stderr, "ERROR %s: %v\n", msg, err)
	os.Exit(1)
}
