// Configuration for all scripts
// To add a new script: Just add it to this array and it will automatically appear in the popup
const SCRIPT_CONFIG = [
  {
    id: 'agendaMenu',
    name: 'Agenda Menu Items',
    description: 'Add Berichten, E-consult, Recept to menu',
    enabled: true,
    riskLevel: 'ui',
    scriptFile: 'scripts/agenda-menu-items.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
{
  id: 'autoDelete',
  name: 'Auto-delete Berichten',
  description: 'Auto-delete spam messages',
  enabled: true,
  riskLevel: 'write',
  scriptFile: 'scripts/auto-delete-berichten.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'autoCheckMedovd',
  name: 'Auto-check MEDOVD & Auto-download',
  description: 'Automatically check MEDOVD and download files',
  enabled: true,
  riskLevel: 'read',
  scriptFile: 'scripts/auto-download-uitschrijfdossier.js',
  urlPatterns: [
    'https://*/promedico/admin.onderhoud.patienten.uitschrijven.m*',
    'https://*/promedico/admin.onderhoud.patienten.uitschrijving.m*'
  ]
},
{
  id: 'briefVerwerker',
  name: 'Verwerk brieven',
  description: 'Extraheert automatisch SOEP-velden uit binnenkomende brieven (HAP, specialisten)',
  enabled: false,
  riskLevel: 'write',
  scriptFile: 'scripts/brief-verwerker.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'consultCopy',
  name: 'Consult kopieren',
  description: 'Kopieer snel consult(en)',
  enabled: true,
  riskLevel: 'write',
  scriptFile: 'scripts/consult-copy.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'contactsoortButtons',
  name: 'Contactsoort Quick Buttons',
  description: 'Quick buttons for contact types',
  enabled: true,
  riskLevel: 'ui',
  scriptFile: 'scripts/contactsoort-quick-buttons.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'correspondentieUpload',
  name: 'Correspondentie Upload',
  description: 'Drag & drop file upload for correspondence',
  enabled: false,
  riskLevel: 'write',
  scriptFile: 'scripts/correspondentie-upload.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'delenWeghalen',
  name: 'Verplaats en Verberg Delen',
  description: 'Verberg het delen deel in deelcontact',
  enabled: true,
  riskLevel: 'ui',
  scriptFile: 'scripts/delen-weghalen.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'econsultTemplates',
  name: 'E-consult Template Responses',
  description: 'Quick template responses for e-consults',
  enabled: true,
  riskLevel: 'write',
  scriptFile: 'scripts/econsult-templates.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'herhaalRecepten',
  name: 'Herhaalrecepten Verwerken',
  description: 'Automatisch alle herhaalrecepten verwerken',
  enabled: false,
  riskLevel: 'write',
  scriptFile: 'scripts/herhaalrecepten.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'initialenSVeld',
  name: 'Initialen in S-veld',
  description: 'Plaatst automatisch je initialen in het S-veld bij het openen van een consult',
  enabled: true,
  riskLevel: 'ui',
  scriptFile: 'scripts/initialen-s-veld.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'inschrijvenMedovd',
  name: 'Inschrijven en MEDOVD Import',
  description: 'Patient registration and MEDOVD import',
  enabled: true,
  riskLevel: 'write',
  scriptFile: 'scripts/inschrijven-medovd.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*'],
  injectMode: 'main_world'
},
{
  id: 'medicatieGenoegVoor',
  name: 'Medicatie — Genoeg voor (standaard 30 dagen)',
  description: 'Vult automatisch 30 dagen in het "Genoeg voor"-veld als Promedico dat leeg laat',
  enabled: true,
  riskLevel: 'write',
  scriptFile: 'scripts/medicatie-genoeg-voor.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'meetwaardenHighlights',
  name: 'Meetwaarden Highlights (2 regels)',
  description: 'Highlight measurement values',
  enabled: true,
  riskLevel: 'read',
  scriptFile: 'scripts/ketenzorg-highlights.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'copyButtons',
  name: 'Copy Phone, Email, BSN, Address',
  description: 'Quick copy buttons for patient info',
  enabled: false,
  riskLevel: 'read',
  scriptFile: 'scripts/kopieer-buttons.js',
  urlPatterns: ['https://www.promedico-asp.nl/*']
},
{
  id: 'lspInstellingen',
  name: 'LSP-instellingen',
  description: 'LSP settings automation',
  enabled: true,
  riskLevel: 'ui',
  scriptFile: 'scripts/lsp-instellingen.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'pVeldherinnering',
  name: 'P veld herinneringen',
  description: 'Automatische herinnering popup in P teksten',
  enabled: true,
  riskLevel: 'read',
  scriptFile: 'scripts/p-veld-herinneringen.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'promedicoCrash',
  name: 'Snel consulten invoeren',
  description: 'Voor als Promedico er weer eens uit heeft gelegen en je alles in word hebt getypt',
  enabled: false,
  riskLevel: 'write',
  scriptFile: 'scripts/consult-recovery.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'soepMeasurements',
  name: 'SOEP Measurements',
  description: 'Measurement automation in SOEP',
  enabled: false,
  riskLevel: 'write',
  scriptFile: 'scripts/soep-metingen.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*'],
  injectMode: 'main_world'
},
{
  id: 'soepSjablonen',
  name: 'SOEP Sjablonen',
  description: 'SOEP templates',
  enabled: true,
  riskLevel: 'write',
  scriptFile: 'scripts/soep-sjablonen.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*'],
  injectMode: 'main_world'
},
{
  id: 'verrichtingQuickButtons',
  name: 'Verrichting Quick Buttons',
  description: 'Snel verrichtingen toevoegen via knoppen op het declaratiescherm',
  enabled: false,
  riskLevel: 'write',
  scriptFile: 'scripts/verrichting-quick-buttons.js',
  urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
},
{
  id: 'znellerFormulieren',
  name: 'ZN formulieren via Zneller.nl',
  description: 'Zneller formulieren invullen uit P',
  enabled: true,
  riskLevel: 'write',
  scriptFile: 'scripts/zneller-formulieren.js',
  urlPatterns: [
    'https://www.promedico-asp.nl/promedico/*',
    'https://www.zneller.nl/*'
  ]
},
{
  id: 'zorgdomeinQuickMenu',
  name: 'Zorgdomein Quick Menu',
  description: 'Quick menu for Zorgdomein',
  enabled: true,
  riskLevel: 'ui',
  scriptFile: 'scripts/zorgdomein-quick-menu.js',
  urlPatterns: [
    'https://www.promedico-asp.nl/promedico/*',
    'https://www.zorgdomein.nl/*'
  ]
}
];
