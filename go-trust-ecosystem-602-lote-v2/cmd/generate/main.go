// Package main provides a command-line tool for generating EUDI Trust Ecosystem
// LoTEs (Lists of Trusted Entities) and LOTL (List of Trusted Lists) in both
// JSON (ETSI TS 119 602) and XML (ETSI TS 119 612) formats.
package main

import (
	"encoding/json"
	"encoding/xml"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

// Entity types in the EUDI Trust Ecosystem
var entityTypes = []string{
	"pid-providers",
	"lpid-providers",
	"qeaa-providers",
	"eaa-providers",
	"pub-eaa-providers",
	"wallet-providers-np",
	"wallet-providers-lp",
	"qes-providers",
	"relying-parties",
}

func main() {
	sourceDir := flag.String("source", "./lote-sources", "Source directory containing LoTE YAML configurations")
	outputDir := flag.String("output", "./output", "Output directory for generated LoTEs and LOTL")
	baseURL := flag.String("base-url", "https://example.com/trust-ecosystem", "Base URL for distribution points")
	flag.Parse()

	log.Println("EUDI Trust Ecosystem LoTE/LOTL Generator")
	log.Println("=========================================")

	// Create output directories
	if err := os.MkdirAll(*outputDir, 0755); err != nil {
		log.Fatalf("Failed to create output directory: %v", err)
	}

	// Generate LoTEs for each entity type
	var lotePointers []LOTEPointer
	for _, entityType := range entityTypes {
		log.Printf("Generating LoTE for: %s", entityType)

		lote, err := generateLoTE(*sourceDir, entityType)
		if err != nil {
			log.Printf("Warning: Failed to generate LoTE for %s: %v", entityType, err)
			continue
		}

		// Update distribution points
		lote.SchemeInformation.DistributionPoints = []string{
			fmt.Sprintf("%s/%s/lote.json", *baseURL, entityType),
			fmt.Sprintf("%s/%s/lote.xml", *baseURL, entityType),
		}

		// Write JSON output
		entityOutputDir := filepath.Join(*outputDir, entityType)
		if err := os.MkdirAll(entityOutputDir, 0755); err != nil {
			log.Printf("Failed to create directory for %s: %v", entityType, err)
			continue
		}

		if err := writeLoTEJSON(lote, filepath.Join(entityOutputDir, "lote.json")); err != nil {
			log.Printf("Failed to write JSON for %s: %v", entityType, err)
		}

		// Write XML output
		if err := writeLoTEXML(lote, filepath.Join(entityOutputDir, "lote.xml")); err != nil {
			log.Printf("Failed to write XML for %s: %v", entityType, err)
		}

		// Add to LOTL pointers
		lotePointers = append(lotePointers, LOTEPointer{
			Location:        fmt.Sprintf("%s/%s/lote.json", *baseURL, entityType),
			SchemeTerritory: lote.SchemeInformation.Territory,
			SchemeType:      lote.SchemeInformation.SchemeType,
		})

		log.Printf("  ✓ Generated LoTE for %s (%d entities)", entityType, len(lote.TrustedEntities))
	}

	// Generate LOTL
	log.Println("Generating LOTL (List of Trusted Lists)...")
	lotl, err := generateLOTL(*sourceDir, lotePointers, *baseURL)
	if err != nil {
		log.Fatalf("Failed to generate LOTL: %v", err)
	}

	// Write LOTL JSON
	if err := writeLoTEJSON(lotl, filepath.Join(*outputDir, "lotl.json")); err != nil {
		log.Fatalf("Failed to write LOTL JSON: %v", err)
	}

	// Write LOTL XML
	if err := writeLoTEXML(lotl, filepath.Join(*outputDir, "lotl.xml")); err != nil {
		log.Fatalf("Failed to write LOTL XML: %v", err)
	}

	log.Println("  ✓ Generated LOTL")
	log.Println("")
	log.Println("Generation complete!")
	log.Printf("Output directory: %s", *outputDir)
}

// generateLoTE creates a LoTE from the source directory
func generateLoTE(sourceDir, entityType string) (*ListOfTrustedEntities, error) {
	schemeFile := filepath.Join(sourceDir, entityType, "scheme.yaml")
	entitiesDir := filepath.Join(sourceDir, entityType, "entities")

	// Load scheme configuration
	scheme, err := loadSchemeYAML(schemeFile)
	if err != nil {
		return nil, fmt.Errorf("failed to load scheme: %w", err)
	}

	// Create LoTE
	now := time.Now().UTC()
	nextUpdate := now.AddDate(0, 1, 0) // 1 month from now

	lote := &ListOfTrustedEntities{
		Version: "1.0",
		SchemeInformation: SchemeInformation{
			Territory:                   scheme.Territory,
			SchemeOperator:              scheme.OperatorNames,
			SchemeName:                  scheme.SchemeName,
			SchemeType:                  scheme.SchemeType,
			SchemeInformationURI:        scheme.SchemeInformationURI,
			StatusDeterminationApproach: scheme.StatusDeterminationApproach,
			PolicyOrLegalNotice:         scheme.PolicyOrLegalNotice,
			IssueDate:                   now,
			NextUpdate:                  &nextUpdate,
			SequenceNumber:              scheme.SequenceNumber,
		},
	}

	// Load entities
	entities, err := loadEntities(entitiesDir)
	if err != nil {
		log.Printf("Warning: Failed to load entities for %s: %v", entityType, err)
	}
	lote.TrustedEntities = entities

	return lote, nil
}

// generateLOTL creates the master List of Trusted Lists
func generateLOTL(sourceDir string, pointers []LOTEPointer, baseURL string) (*ListOfTrustedEntities, error) {
	schemeFile := filepath.Join(sourceDir, "lotl", "scheme.yaml")

	// Load LOTL scheme configuration
	scheme, err := loadSchemeYAML(schemeFile)
	if err != nil {
		return nil, fmt.Errorf("failed to load LOTL scheme: %w", err)
	}

	now := time.Now().UTC()
	nextUpdate := now.AddDate(0, 1, 0)

	lotl := &ListOfTrustedEntities{
		Version: "1.0",
		SchemeInformation: SchemeInformation{
			Territory:                   scheme.Territory,
			SchemeOperator:              scheme.OperatorNames,
			SchemeName:                  scheme.SchemeName,
			SchemeType:                  scheme.SchemeType,
			SchemeInformationURI:        scheme.SchemeInformationURI,
			StatusDeterminationApproach: scheme.StatusDeterminationApproach,
			PolicyOrLegalNotice:         scheme.PolicyOrLegalNotice,
			IssueDate:                   now,
			NextUpdate:                  &nextUpdate,
			SequenceNumber:              scheme.SequenceNumber,
			DistributionPoints: []string{
				fmt.Sprintf("%s/lotl.json", baseURL),
				fmt.Sprintf("%s/lotl.xml", baseURL),
			},
		},
		PointersToOtherLoTEs: pointers,
	}

	return lotl, nil
}

// loadSchemeYAML loads a scheme.yaml file
func loadSchemeYAML(path string) (*SchemeYAML, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var scheme SchemeYAML
	if err := yaml.Unmarshal(data, &scheme); err != nil {
		return nil, err
	}

	return &scheme, nil
}

// loadEntities loads all entities from a directory
func loadEntities(entitiesDir string) ([]TrustedEntity, error) {
	var entities []TrustedEntity

	entries, err := os.ReadDir(entitiesDir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		entityFile := filepath.Join(entitiesDir, entry.Name(), "entity.yaml")
		entity, err := loadEntityYAML(entityFile)
		if err != nil {
			log.Printf("Warning: Failed to load entity %s: %v", entry.Name(), err)
			continue
		}

		// Load digital identities (certificates, JWKs, DIDs)
		digitalIDs, err := loadDigitalIdentities(filepath.Join(entitiesDir, entry.Name()))
		if err != nil {
			log.Printf("Warning: Failed to load digital identities for %s: %v", entry.Name(), err)
		}

		now := time.Now().UTC()
		trustedEntity := TrustedEntity{
			EntityID:           entity.EntityID,
			EntityName:         entity.Names,
			EntityType:         entity.EntityType,
			EntityStatus:       entity.Status,
			StatusStartingTime: &now,
			DigitalIdentities:  digitalIDs,
			InformationURIs:    entity.InformationURIs,
		}

		// Convert services
		for _, svc := range entity.Services {
			trustedEntity.Services = append(trustedEntity.Services, EntityService{
				ServiceType:         svc.ServiceType,
				ServiceName:         svc.ServiceNames,
				ServiceStatus:       svc.Status,
				StatusStartingTime:  &now,
				ServiceSupplyPoints: svc.ServiceSupplyPoints,
			})
		}

		entities = append(entities, trustedEntity)
	}

	return entities, nil
}

// loadEntityYAML loads an entity.yaml file
func loadEntityYAML(path string) (*EntityYAML, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var entity EntityYAML
	if err := yaml.Unmarshal(data, &entity); err != nil {
		return nil, err
	}

	return &entity, nil
}

// loadDigitalIdentities loads certificates, JWKs, and DIDs from an entity directory
func loadDigitalIdentities(entityDir string) ([]DigitalIdentity, error) {
	var identities []DigitalIdentity

	// Look for PEM certificates
	pemFiles, _ := filepath.Glob(filepath.Join(entityDir, "*.pem"))
	for _, pemFile := range pemFiles {
		if filepath.Base(pemFile) == "signing-key.pem" {
			continue // Skip private keys
		}
		data, err := os.ReadFile(pemFile)
		if err != nil {
			continue
		}
		identities = append(identities, DigitalIdentity{
			Type:            "x509",
			X509Certificate: string(data),
		})
	}

	// Look for DER certificates
	derFiles, _ := filepath.Glob(filepath.Join(entityDir, "*.der"))
	for _, derFile := range derFiles {
		data, err := os.ReadFile(derFile)
		if err != nil {
			continue
		}
		identities = append(identities, DigitalIdentity{
			Type:            "x509",
			X509Certificate: string(data),
		})
	}

	// Look for JWK files
	jwkFiles, _ := filepath.Glob(filepath.Join(entityDir, "*.jwk"))
	for _, jwkFile := range jwkFiles {
		data, err := os.ReadFile(jwkFile)
		if err != nil {
			continue
		}
		var jwk map[string]any
		if err := json.Unmarshal(data, &jwk); err != nil {
			continue
		}
		identities = append(identities, DigitalIdentity{
			Type: "jwk",
			JWK:  jwk,
		})
	}

	// Look for DID files
	didFiles, _ := filepath.Glob(filepath.Join(entityDir, "*.did"))
	for _, didFile := range didFiles {
		data, err := os.ReadFile(didFile)
		if err != nil {
			continue
		}
		identities = append(identities, DigitalIdentity{
			Type: "did",
			DID:  string(data),
		})
	}

	return identities, nil
}

// writeLoTEJSON writes a LoTE to a JSON file
func writeLoTEJSON(lote *ListOfTrustedEntities, path string) error {
	data, err := json.MarshalIndent(lote, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

// writeLoTEXML writes a LoTE to an XML file (ETSI TS 119 612 compatible)
func writeLoTEXML(lote *ListOfTrustedEntities, path string) error {
	xmlLote := convertToXML(lote)
	data, err := xml.MarshalIndent(xmlLote, "", "  ")
	if err != nil {
		return err
	}

	// Add XML declaration
	output := []byte(xml.Header)
	output = append(output, data...)
	return os.WriteFile(path, output, 0644)
}

// convertToXML converts a LoTE to XML format
func convertToXML(lote *ListOfTrustedEntities) *TrustStatusListXML {
	xml := &TrustStatusListXML{
		XMLName: xmlName{
			Space: "http://uri.etsi.org/02231/v2#",
			Local: "TrustServiceStatusList",
		},
		TSLTag: "http://uri.etsi.org/02231/TSLTag",
		SchemeInformation: SchemeInformationXML{
			TSLVersionIdentifier: 5,
			TSLSequenceNumber:    lote.SchemeInformation.SequenceNumber,
			TSLType:              lote.SchemeInformation.SchemeType,
			SchemeTerritory:      lote.SchemeInformation.Territory,
			ListIssueDateTime:    lote.SchemeInformation.IssueDate.Format(time.RFC3339),
			StatusDeterminationApproach: lote.SchemeInformation.StatusDeterminationApproach,
		},
	}

	// Convert operator names
	for _, name := range lote.SchemeInformation.SchemeOperator {
		xml.SchemeInformation.SchemeOperatorName.Names = append(
			xml.SchemeInformation.SchemeOperatorName.Names,
			MultiLangStringXML{Language: name.Language, Value: name.Value},
		)
	}

	// Convert scheme name
	for _, name := range lote.SchemeInformation.SchemeName {
		xml.SchemeInformation.SchemeName.Names = append(
			xml.SchemeInformation.SchemeName.Names,
			MultiLangStringXML{Language: name.Language, Value: name.Value},
		)
	}

	// Convert information URIs
	for _, uri := range lote.SchemeInformation.SchemeInformationURI {
		xml.SchemeInformation.SchemeInformationURI.URIs = append(
			xml.SchemeInformation.SchemeInformationURI.URIs,
			MultiLangURIXML{Language: uri.Language, Value: uri.URI},
		)
	}

	// Convert policy notice
	for _, notice := range lote.SchemeInformation.PolicyOrLegalNotice {
		xml.SchemeInformation.PolicyOrLegalNotice.Notices = append(
			xml.SchemeInformation.PolicyOrLegalNotice.Notices,
			MultiLangStringXML{Language: notice.Language, Value: notice.Value},
		)
	}

	// Convert next update
	if lote.SchemeInformation.NextUpdate != nil {
		xml.SchemeInformation.NextUpdate.DateTime = lote.SchemeInformation.NextUpdate.Format(time.RFC3339)
	}

	// Convert distribution points
	for _, dp := range lote.SchemeInformation.DistributionPoints {
		xml.SchemeInformation.DistributionPoints.URIs = append(
			xml.SchemeInformation.DistributionPoints.URIs, dp)
	}

	// Convert trusted entities to TSPs
	for _, entity := range lote.TrustedEntities {
		tsp := TrustServiceProviderXML{}

		// TSP name
		for _, name := range entity.EntityName {
			tsp.TSPInformation.TSPName.Names = append(
				tsp.TSPInformation.TSPName.Names,
				MultiLangStringXML{Language: name.Language, Value: name.Value},
			)
		}

		// Information URIs
		for _, uri := range entity.InformationURIs {
			tsp.TSPInformation.TSPInformationURI.URIs = append(
				tsp.TSPInformation.TSPInformationURI.URIs,
				MultiLangURIXML{Language: uri.Language, Value: uri.URI},
			)
		}

		// Convert services
		for _, svc := range entity.Services {
			service := TSPServiceXML{
				ServiceInformation: ServiceInformationXML{
					ServiceTypeIdentifier: svc.ServiceType,
					ServiceStatus:         svc.ServiceStatus,
				},
			}

			// Service name
			for _, name := range svc.ServiceName {
				service.ServiceInformation.ServiceName.Names = append(
					service.ServiceInformation.ServiceName.Names,
					MultiLangStringXML{Language: name.Language, Value: name.Value},
				)
			}

			// Status starting time
			if svc.StatusStartingTime != nil {
				service.ServiceInformation.StatusStartingTime = svc.StatusStartingTime.Format(time.RFC3339)
			}

			// Service supply points
			for _, sp := range svc.ServiceSupplyPoints {
				service.ServiceInformation.ServiceSupplyPoints.Points = append(
					service.ServiceInformation.ServiceSupplyPoints.Points, sp)
			}

			// Digital identities
			for _, di := range svc.DigitalIdentities {
				xmlDI := DigitalIdentityXML{}
				switch di.Type {
				case "x509":
					xmlDI.X509Certificate = di.X509Certificate
				case "x509_subject_name":
					xmlDI.X509SubjectName = di.X509SubjectName
				}
				service.ServiceInformation.ServiceDigitalIdentity.DigitalIds = append(
					service.ServiceInformation.ServiceDigitalIdentity.DigitalIds, xmlDI)
			}

			tsp.TSPServices.Services = append(tsp.TSPServices.Services, service)
		}

		xml.TrustServiceProviderList.TSPs = append(xml.TrustServiceProviderList.TSPs, tsp)
	}

	// Convert pointers to other LoTEs
	for _, ptr := range lote.PointersToOtherLoTEs {
		pointer := OtherTSLPointerXML{
			TSLLocation: ptr.Location,
			AdditionalInformation: AdditionalInformationXML{
				SchemeTerritory:    ptr.SchemeTerritory,
				OtherTSLSchemeType: ptr.SchemeType,
			},
		}
		xml.SchemeInformation.PointersToOtherTSL.Pointers = append(
			xml.SchemeInformation.PointersToOtherTSL.Pointers, pointer)
	}

	return xml
}
