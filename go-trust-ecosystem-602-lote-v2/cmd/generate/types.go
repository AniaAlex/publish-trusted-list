package main

import (
	"time"
)

// ============================================================================
// JSON Types (ETSI TS 119 602 - LoTE)
// ============================================================================

// ListOfTrustedEntities is the root type for an ETSI TS 119 602 trust list.
type ListOfTrustedEntities struct {
	Version              string            `json:"version"`
	SchemeInformation    SchemeInformation `json:"schemeInformation"`
	TrustedEntities      []TrustedEntity   `json:"trustedEntities,omitempty"`
	PointersToOtherLoTEs []LOTEPointer     `json:"pointersToOtherLoTEs,omitempty"`
}

// SchemeInformation contains metadata about the trust list and its operator.
type SchemeInformation struct {
	Territory                   string       `json:"territory,omitempty"`
	SchemeOperator              NameSet      `json:"schemeOperator"`
	SchemeName                  NameSet      `json:"schemeName,omitempty"`
	SchemeType                  string       `json:"schemeType"`
	SchemeInformationURI        []LangURI    `json:"schemeInformationURI,omitempty"`
	StatusDeterminationApproach string       `json:"statusDeterminationApproach,omitempty"`
	PolicyOrLegalNotice         []LangString `json:"policyOrLegalNotice,omitempty"`
	IssueDate                   time.Time    `json:"issueDate"`
	NextUpdate                  *time.Time   `json:"nextUpdate,omitempty"`
	SequenceNumber              int          `json:"sequenceNumber"`
	DistributionPoints          []string     `json:"distributionPoints,omitempty"`
}

// TrustedEntity represents a single trusted entity in the list.
type TrustedEntity struct {
	EntityID           string            `json:"entityId"`
	EntityName         NameSet           `json:"entityName"`
	EntityType         string            `json:"entityType,omitempty"`
	EntityStatus       string            `json:"entityStatus"`
	StatusStartingTime *time.Time        `json:"statusStartingTime,omitempty"`
	DigitalIdentities  []DigitalIdentity `json:"digitalIdentities,omitempty"`
	Services           []EntityService   `json:"services,omitempty"`
	InformationURIs    []LangURI         `json:"informationURIs,omitempty"`
	Extensions         map[string]any    `json:"extensions,omitempty"`
}

// EntityService describes a specific trust service provided by an entity.
type EntityService struct {
	ServiceType         string            `json:"serviceType"`
	ServiceName         NameSet           `json:"serviceName,omitempty"`
	ServiceStatus       string            `json:"serviceStatus"`
	StatusStartingTime  *time.Time        `json:"statusStartingTime,omitempty"`
	DigitalIdentities   []DigitalIdentity `json:"digitalIdentities,omitempty"`
	ServiceSupplyPoints []string          `json:"serviceSupplyPoints,omitempty"`
	Extensions          map[string]any    `json:"extensions,omitempty"`
}

// DigitalIdentity represents a public key or certificate for an entity.
type DigitalIdentity struct {
	Type            string         `json:"type"`
	JWK             map[string]any `json:"jwk,omitempty"`
	X509Certificate string         `json:"x509Certificate,omitempty"`
	X509SubjectName string         `json:"x509SubjectName,omitempty"`
	DID             string         `json:"did,omitempty"`
}

// LOTEPointer references another List of Trusted Entities.
type LOTEPointer struct {
	Location              string            `json:"location"`
	SchemeTerritory       string            `json:"schemeTerritory,omitempty"`
	SchemeType            string            `json:"schemeType,omitempty"`
	DigitalIdentities     []DigitalIdentity `json:"digitalIdentities,omitempty"`
	AdditionalInformation map[string]any    `json:"additionalInformation,omitempty"`
}

// LangString is a string value with a language tag.
type LangString struct {
	Language string `json:"language"`
	Value    string `json:"value"`
}

// LangURI is a URI with a language tag.
type LangURI struct {
	Language string `json:"language"`
	URI      string `json:"uri"`
}

// NameSet is an ordered list of names in different languages.
type NameSet []LangString

// ============================================================================
// YAML Configuration Types
// ============================================================================

// SchemeYAML represents a scheme.yaml configuration file
type SchemeYAML struct {
	OperatorNames               NameSet      `yaml:"operatorNames"`
	SchemeName                  NameSet      `yaml:"schemeName"`
	SchemeType                  string       `yaml:"schemeType"`
	Territory                   string       `yaml:"territory"`
	SequenceNumber              int          `yaml:"sequenceNumber"`
	SchemeInformationURI        []LangURI    `yaml:"schemeInformationURI"`
	StatusDeterminationApproach string       `yaml:"statusDeterminationApproach"`
	PolicyOrLegalNotice         []LangString `yaml:"policyOrLegalNotice"`
	DistributionPoints          []string     `yaml:"distributionPoints"`
}

// EntityYAML represents an entity.yaml configuration file
type EntityYAML struct {
	EntityID        string           `yaml:"entityId"`
	EntityType      string           `yaml:"entityType"`
	Names           NameSet          `yaml:"names"`
	Status          string           `yaml:"status"`
	InformationURIs []LangURI        `yaml:"informationURIs"`
	Services        []ServiceYAML    `yaml:"services"`
}

// ServiceYAML represents a service in entity.yaml
type ServiceYAML struct {
	ServiceType         string   `yaml:"serviceType"`
	ServiceNames        NameSet  `yaml:"serviceNames"`
	Status              string   `yaml:"status"`
	ServiceSupplyPoints []string `yaml:"serviceSupplyPoints"`
}

// ============================================================================
// XML Types (ETSI TS 119 612 - TSL)
// ============================================================================

type xmlName struct {
	Space string `xml:"xmlns,attr"`
	Local string `xml:"-"`
}

// TrustStatusListXML is the root XML element for ETSI TS 119 612
type TrustStatusListXML struct {
	XMLName                  xmlName                      `xml:"TrustServiceStatusList"`
	TSLTag                   string                       `xml:"TSLTag,attr"`
	SchemeInformation        SchemeInformationXML         `xml:"SchemeInformation"`
	TrustServiceProviderList TrustServiceProviderListXML  `xml:"TrustServiceProviderList,omitempty"`
}

// SchemeInformationXML contains TSL scheme metadata
type SchemeInformationXML struct {
	TSLVersionIdentifier        int                       `xml:"TSLVersionIdentifier"`
	TSLSequenceNumber           int                       `xml:"TSLSequenceNumber"`
	TSLType                     string                    `xml:"TSLType"`
	SchemeOperatorName          MultiLangNamesXML         `xml:"SchemeOperatorName"`
	SchemeName                  MultiLangNamesXML         `xml:"SchemeName"`
	SchemeInformationURI        MultiLangURIsXML          `xml:"SchemeInformationURI"`
	StatusDeterminationApproach string                    `xml:"StatusDeterminationApproach"`
	SchemeTerritory             string                    `xml:"SchemeTerritory"`
	PolicyOrLegalNotice         PolicyOrLegalNoticeXML    `xml:"PolicyOrLegalNotice"`
	ListIssueDateTime           string                    `xml:"ListIssueDateTime"`
	NextUpdate                  NextUpdateXML             `xml:"NextUpdate"`
	DistributionPoints          DistributionPointsXML     `xml:"DistributionPoints,omitempty"`
	PointersToOtherTSL          PointersToOtherTSLXML     `xml:"PointersToOtherTSL,omitempty"`
}

// MultiLangNamesXML holds multi-language names
type MultiLangNamesXML struct {
	Names []MultiLangStringXML `xml:"Name"`
}

// MultiLangStringXML is a string with xml:lang attribute
type MultiLangStringXML struct {
	Language string `xml:"lang,attr"`
	Value    string `xml:",chardata"`
}

// MultiLangURIsXML holds multi-language URIs
type MultiLangURIsXML struct {
	URIs []MultiLangURIXML `xml:"URI"`
}

// MultiLangURIXML is a URI with xml:lang attribute
type MultiLangURIXML struct {
	Language string `xml:"lang,attr"`
	Value    string `xml:",chardata"`
}

// PolicyOrLegalNoticeXML contains policy notices
type PolicyOrLegalNoticeXML struct {
	Notices []MultiLangStringXML `xml:"TSLLegalNotice"`
}

// NextUpdateXML contains the next update time
type NextUpdateXML struct {
	DateTime string `xml:"dateTime"`
}

// DistributionPointsXML contains distribution point URIs
type DistributionPointsXML struct {
	URIs []string `xml:"URI"`
}

// PointersToOtherTSLXML contains pointers to other TSLs
type PointersToOtherTSLXML struct {
	Pointers []OtherTSLPointerXML `xml:"OtherTSLPointer"`
}

// OtherTSLPointerXML represents a pointer to another TSL
type OtherTSLPointerXML struct {
	ServiceDigitalIdentities ServiceDigitalIdentitiesXML `xml:"ServiceDigitalIdentities,omitempty"`
	TSLLocation              string                      `xml:"TSLLocation"`
	AdditionalInformation    AdditionalInformationXML    `xml:"AdditionalInformation"`
}

// AdditionalInformationXML contains additional TSL pointer info
type AdditionalInformationXML struct {
	SchemeTerritory    string `xml:"SchemeTerritory,omitempty"`
	OtherTSLSchemeType string `xml:"OtherTSLSchemeType,omitempty"`
}

// TrustServiceProviderListXML contains the list of TSPs
type TrustServiceProviderListXML struct {
	TSPs []TrustServiceProviderXML `xml:"TrustServiceProvider"`
}

// TrustServiceProviderXML represents a Trust Service Provider
type TrustServiceProviderXML struct {
	TSPInformation TSPInformationXML `xml:"TSPInformation"`
	TSPServices    TSPServicesXML    `xml:"TSPServices"`
}

// TSPInformationXML contains TSP metadata
type TSPInformationXML struct {
	TSPName           MultiLangNamesXML `xml:"TSPName"`
	TSPTradeName      MultiLangNamesXML `xml:"TSPTradeName,omitempty"`
	TSPAddress        TSPAddressXML     `xml:"TSPAddress,omitempty"`
	TSPInformationURI MultiLangURIsXML  `xml:"TSPInformationURI"`
}

// TSPAddressXML contains TSP address info
type TSPAddressXML struct {
	PostalAddresses     []PostalAddressXML     `xml:"PostalAddresses>PostalAddress,omitempty"`
	ElectronicAddresses []ElectronicAddressXML `xml:"ElectronicAddresses>ElectronicAddress,omitempty"`
}

// PostalAddressXML represents a postal address
type PostalAddressXML struct {
	Language      string `xml:"lang,attr"`
	StreetAddress string `xml:"StreetAddress,omitempty"`
	Locality      string `xml:"Locality,omitempty"`
	PostalCode    string `xml:"PostalCode,omitempty"`
	CountryName   string `xml:"CountryName,omitempty"`
}

// ElectronicAddressXML represents an electronic address
type ElectronicAddressXML struct {
	URI string `xml:"URI"`
}

// TSPServicesXML contains TSP services
type TSPServicesXML struct {
	Services []TSPServiceXML `xml:"TSPService"`
}

// TSPServiceXML represents a TSP service
type TSPServiceXML struct {
	ServiceInformation ServiceInformationXML `xml:"ServiceInformation"`
	ServiceHistory     ServiceHistoryXML     `xml:"ServiceHistory,omitempty"`
}

// ServiceInformationXML contains service metadata
type ServiceInformationXML struct {
	ServiceTypeIdentifier  string                      `xml:"ServiceTypeIdentifier"`
	ServiceName            MultiLangNamesXML           `xml:"ServiceName"`
	ServiceDigitalIdentity ServiceDigitalIdentitiesXML `xml:"ServiceDigitalIdentity"`
	ServiceStatus          string                      `xml:"ServiceStatus"`
	StatusStartingTime     string                      `xml:"StatusStartingTime"`
	ServiceSupplyPoints    ServiceSupplyPointsXML      `xml:"ServiceSupplyPoints,omitempty"`
}

// ServiceDigitalIdentitiesXML contains digital identities
type ServiceDigitalIdentitiesXML struct {
	DigitalIds []DigitalIdentityXML `xml:"DigitalId"`
}

// DigitalIdentityXML represents a digital identity in XML
type DigitalIdentityXML struct {
	X509Certificate string `xml:"X509Certificate,omitempty"`
	X509SubjectName string `xml:"X509SubjectName,omitempty"`
	Other           string `xml:"other,omitempty"`
}

// ServiceSupplyPointsXML contains service endpoints
type ServiceSupplyPointsXML struct {
	Points []string `xml:"ServiceSupplyPoint"`
}

// ServiceHistoryXML contains service history
type ServiceHistoryXML struct {
	Instances []ServiceHistoryInstanceXML `xml:"ServiceHistoryInstance"`
}

// ServiceHistoryInstanceXML represents a historical service state
type ServiceHistoryInstanceXML struct {
	ServiceTypeIdentifier  string                      `xml:"ServiceTypeIdentifier"`
	ServiceName            MultiLangNamesXML           `xml:"ServiceName"`
	ServiceDigitalIdentity ServiceDigitalIdentitiesXML `xml:"ServiceDigitalIdentity"`
	ServiceStatus          string                      `xml:"ServiceStatus"`
	StatusStartingTime     string                      `xml:"StatusStartingTime"`
}
