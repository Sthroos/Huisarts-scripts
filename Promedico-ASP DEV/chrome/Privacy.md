# Privacy Policy — Promedico ASP Helper

*Last updated: 2 March 2026*

## 1. Introduction

Promedico ASP Helper ("the Extension") is a browser extension for Google Chrome and Mozilla Firefox. It is developed to automate and streamline workflows within Promedico ASP, a medical practice management system used by general practitioners in the Netherlands. This privacy policy explains what data the Extension collects and how it is used.

## 2. Data We Collect

The Extension stores the following data locally on your device:

- **User preferences and settings**, such as which scripts are enabled or disabled. This data is stored exclusively in your browser's local storage (`chrome.storage.local` / `browser.storage.local`) and never leaves your device.

The Extension does not collect, transmit, or store any other data. Specifically, the Extension does not collect:

- Patient data or medical records
- Personal information of any kind
- Login credentials or passwords
- Browsing history
- Location data
- Usage statistics or analytics

## 3. Data Sharing

The Extension does not share any data with third parties. There is no analytics, tracking, advertising network, or telemetry built into the Extension. The only external connection the Extension makes is to GitHub (github.com) to retrieve script update files — this is a one-way download of program code only, and no user data is sent.

## 4. Data Storage and Retention

All settings are stored locally on your device using the browser Storage API. There is no server, database, or cloud storage associated with this Extension. When the Extension is uninstalled, all locally stored settings are deleted.

## 5. Permissions

The Extension requests the following browser permissions, which are necessary for its functionality:

- **storage** — to save your settings locally
- **tabs** — to interact with the active browser tab
- **Access to promedico-asp.nl, zorgdomein.nl, and zneller.nl** — to run automation scripts on these medical platforms

No permission is used to collect or transmit personal data.

## 6. Security

Because the Extension does not transmit data outside your device, the risk of data breaches via the Extension is minimal. Script files are retrieved over a secure HTTPS connection from GitHub.

## 7. Changes to This Policy

If significant changes are made to how the Extension handles data, this privacy policy will be updated. The current version is always available at the Extension's GitHub repository.

## 8. Contact

If you have questions about this privacy policy, please open an issue on GitHub:
https://github.com/Sthroos/Huisarts-scripts
