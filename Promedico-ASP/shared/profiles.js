// profiles.js
// Definieert regio-profielen voor de Promedico ASP Helper.
// Elk profiel bevat:
//   - id          unieke sleutel die ook als storage-key gebruikt wordt
//   - name        weergavenaam in onboarding en popup
//   - description korte toelichting voor de gebruiker
//   - menuFile    welk zorgdomein-menu geladen wordt
//   - settings    standaardwaarden voor alle instelbare opties

const PROFILES = [
  {
    id: 'eemland',
    name: 'Regio Eemland',
    description: 'Meander MC, Amersfoort e.o. Inclusief BVO koerier en POCT Connect.',
    menuFile: 'zorgdomein-menus/menu-eemland.js',
    settings: {
      bvoKoerier: true,
      crpPoct:    true,
    }
  },
  {
    id: 'generiek',
    name: 'Generiek (landelijk)',
    description: 'Geen regio-specifieke verwijzingen. Zorgdomein opent op de algemene startpagina.',
    menuFile: 'zorgdomein-menus/menu-generiek.js',
    settings: {
      bvoKoerier: false,
      crpPoct:    false,
    }
  },
  {
    id: 'utrecht',
    name: 'Regio Utrecht',
    description: 'Diakonessenhuis e.o..',
    menuFile: 'zorgdomein-menus/menu-utrecht.js',
    settings: {
      bvoKoerier: false,
      crpPoct:    false,
    }
  },
  {
    id: 'arnhem',
    name: 'Regio Arnhem',
    description: 'Rijnstate ziekenhuis e.o..',
    menuFile: 'zorgdomein-menus/menu-arnhem.js',
    settings: {
      bvoKoerier: false,
      crpPoct:    false,
    }
  }
];