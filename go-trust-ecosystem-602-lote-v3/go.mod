module demo/lote-production

go 1.26

require github.com/sirosfoundation/g119612 v0.0.0

require (
	github.com/PuerkitoBio/goquery v1.12.0 // indirect
	github.com/ThalesGroup/crypto11 v1.6.0 // indirect
	github.com/andybalholm/cascadia v1.3.3 // indirect
	github.com/beevik/etree v1.6.0 // indirect
	github.com/go-jose/go-jose/v4 v4.1.4 // indirect
	github.com/jonboulle/clockwork v0.5.0 // indirect
	github.com/miekg/pkcs11 v1.1.2 // indirect
	github.com/moov-io/signedxml v1.2.3 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/russellhaering/goxmldsig v1.5.0 // indirect
	github.com/sirosfoundation/go-cryptoutil v0.5.0 // indirect
	github.com/sirupsen/logrus v1.9.4 // indirect
	github.com/thales-e-security/pool v0.0.2 // indirect
	golang.org/x/net v0.52.0 // indirect
	golang.org/x/sys v0.42.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

replace github.com/sirosfoundation/g119612 => ../g119612

replace github.com/moov-io/signedxml v1.2.3 => github.com/sirosfoundation/signedxml v1.4.0-siros1

replace github.com/russellhaering/goxmldsig v1.5.0 => github.com/sirosfoundation/goxmldsig v1.6.0-siros1
