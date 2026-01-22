// Configuration for all scripts
// To add a new script: Just add it to this array and it will automatically appear in the popup
const SCRIPT_CONFIG = [
  {
    id: 'agendaMenu',
    name: 'Agenda Menu Items',
    description: 'Add Berichten, E-consult, Recept to menu',
    enabled: true,
    scriptFile: 'scripts/agenda-menu-items.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
  {
    id: 'autoDelete',
    name: 'Auto-delete Berichten',
    description: 'Auto-delete spam messages',
    enabled: true,
    scriptFile: 'scripts/auto-delete-berichten.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
  {
    id: 'autoCheckMedovd',
    name: 'Auto-check MEDOVD & Auto-download',
    description: 'Automatically check MEDOVD and download files',
    enabled: true,
    scriptFile: 'scripts/auto-download-uitschrijfdossier.js',
    urlPatterns: [
      'https://*/promedico/admin.onderhoud.patienten.uitschrijven.m*',
      'https://*/promedico/admin.onderhoud.patienten.uitschrijving.m*'
    ]
  },
  {
    id: 'contactsoortButtons',
    name: 'Contactsoort Quick Buttons',
    description: 'Quick buttons for contact types',
    enabled: true,
    scriptFile: 'scripts/contactsoort-quick-buttons.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
  {
    id: 'correspondentieUpload',
    name: 'Correspondentie Upload',
    description: 'Drag & drop file upload for correspondence',
    enabled: true,
    scriptFile: 'scripts/correspondentie-upload.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
  {
    id: 'econsultTemplates',
    name: 'E-consult Template Responses',
    description: 'Quick template responses for e-consults',
    enabled: true,
    scriptFile: 'scripts/econsult-templates.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
  {
    id: 'inschrijvenMedovd',
    name: 'Inschrijven en MEDOVD Import',
    description: 'Patient registration and MEDOVD import',
    enabled: true,
    scriptFile: 'scripts/inschrijven-medovd.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
  {
    id: 'meetwaardenHighlights',
    name: 'Meetwaarden Highlights (2 regels)',
    description: 'Highlight measurement values',
    enabled: true,
    scriptFile: 'scripts/ketenzorg-highlights.js',
    urlPatterns: ['*://*/promedico/*']
  },
  {
    id: 'copyButtons',
    name: 'Copy Phone, Email, BSN, Address',
    description: 'Quick copy buttons for patient info',
    enabled: true,
    scriptFile: 'scripts/kopieer-buttons.js',
    urlPatterns: ['https://www.promedico-asp.nl/*']
  },
  {
    id: 'lspInstellingen',
    name: 'LSP-instellingen',
    description: 'LSP settings automation',
    enabled: true,
    scriptFile: 'scripts/lsp-instellingen.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
  {
    id: 'pVeldherinnering',
    name: 'P veld herinneringen',
    description: 'Automatische herinnering popup in P teksten',
    enabled: true,
    scriptFile: 'scripts/p-veld-herinneringen.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
  {
    id: 'soepMeasurements',
    name: 'SOEP Measurements',
    description: 'Measurement automation in SOEP',
    enabled: true,
    scriptFile: 'scripts/soep-metingen.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
  {
    id: 'soepSjablonen',
    name: 'SOEP Sjablonen',
    description: 'SOEP templates',
    enabled: true,
    scriptFile: 'scripts/soep-sjablonen.js',
    urlPatterns: ['https://www.promedico-asp.nl/promedico/*']
  },
  {
    id: 'zorgdomeinQuickMenu',
    name: 'Zorgdomein Quick Menu',
    description: 'Quick menu for Zorgdomein',
    enabled: true,
    scriptFile: 'scripts/zorgdomein-quick-menu.js',
    urlPatterns: [
      'https://www.promedico-asp.nl/promedico/*',
      'https://www.zorgdomein.nl/*'
    ]
  }
];

// GitHub configuration for auto-updates
const GITHUB_CONFIG = {
  enabled: false, // Set to false to disable auto-updates
  owner: 'Sthroos', // Change this to your GitHub username
  repo: 'Huisarts-scripts', // Change this to your repo name
  branch: 'main',
  scriptsPath: 'Promedico-ASP/Firefox/scripts', // Folder in repo containing scripts
  checkInterval: 3600000, // Check every hour (in milliseconds)
  // Script files should be named: script-name.js
  // Config files should be named: script-name.json and contain:
  // {
  //   "id": "scriptId",
  //   "name": "Display Name",
  //   "description": "What it does",
  //   "enabled": true
  // }
};
