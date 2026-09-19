# Maintainers

| Naam | Rol | GitHub | Toegang |
|---|---|---|---|
| Sebastiaan Roos | Primaire ontwikkelaar | Sthroos | Release-bevoegdheid, store-credentials |
| Daan Commandeur | Backup-maintainer | [commandeurdaan](https://github.com/commandeurdaan) | Commit-toegang; releasebevoegdheid via CI zodra ingericht |

## Bij onbeschikbaarheid van de primaire maintainer
Daan Commandeur neemt release-taken over. Zodra de CI-pipeline is ingericht
(GitHub Actions met repository-secrets voor AMO/Edge/Chrome), kan hij releases
publiceren via die workflow zonder zelf de losse store-credentials te hoeven
bezitten.

## Credential-rotatie
[TODO — in te vullen zodra credentials naar GitHub Actions-secrets zijn
gemigreerd; tot die tijd staan ze lokaal in `.env` op de laptop van Sebastiaan]
