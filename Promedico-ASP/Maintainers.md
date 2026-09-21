# Maintainers

| Naam | Rol | GitHub | Toegang |
|---|---|---|---|
| Sebastiaan Roos | Primaire ontwikkelaar | Sthroos | Release-bevoegdheid, store-credentials |
| Daan Commandeur | Backup-maintainer | [commandeurdaan](https://github.com/commandeurdaan) | Commit-toegang; releasebevoegd via CI (workflow_dispatch, actief) |

## Bij onbeschikbaarheid van de primaire maintainer
Daan Commandeur neemt release-taken over. De CI-pipeline (`.github/workflows/release.yml`)
draait via `workflow_dispatch`; Daan kan een release triggeren en goedkeuren
zonder ooit de AMO/Edge/Chrome-credentials zelf in handen te krijgen — die
staan uitsluitend in GitHub Actions repository-secrets binnen de
`release`-environment.

## Credential-rotatie
AMO-, Edge- en Chrome-credentials staan in GitHub Actions repository-secrets
(environment `release`), niet meer lokaal in `.env`. Rotatie: Sebastiaan
vervangt de secrets via Settings → Environments → release, bij vermoeden van
compromittering direct, anders jaarlijks. Edge & Chrome API-key verloopt sowieso
~90 dagen en wordt bij die gelegenheid meteen herzet.
