// zorgdomein-instellingen.js
// Lijst van alle selecteerbare zorginstellingen voor het Zorgdomein quick menu.
// Structuur:
//   id        : unieke sleutel (lowercase, geen spaties)
//   naam      : weergavenaam in onboarding en menu
//   type      : 'ziekenhuis' | 'laboratorium' | 'overig'
//   provincie : voor filtering in onboarding (kan meerdere zijn, kommagescheiden)
//   producten : array van { label, subtext?, url }

const ZORGDOMEIN_INSTELLINGEN = [

  // ─────────────────────────────────────────────────────────────────────────
  // ZIEKENHUIZEN
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'hagaziekenhuis',
    naam: 'HagaZiekenhuis',
    type: 'ziekenhuis',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Semenanalyse (KCHL)',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7c7ca5e1-7f3d-4597-b820-bc59383e31b4' },
      { label: 'Semenanalyse (KCHL) 2',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/73b3ad6c-aa80-4aa7-ad29-7502e045a3eb' },
      { label: 'KCHL en MMB voor Saffier Groep',               url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2ba91060-5971-4efe-9945-f39c28349876' },
      { label: 'Afmelden/wijzigen chronische zorg',            url: 'https://www.zorgdomein.nl/zd/referral/choose-product/78884573-3630-407b-a148-a1a3863c141c' },
      { label: 'Cytologische punctie',                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/515a4b9f-c985-4429-a405-0d45784dd00c' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/68750f53-707a-4f74-b4bd-68a8bd188493' },
      { label: 'Pathologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1766' },
      { label: 'Klinische chemie en Medische microbiologie',   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3b271c17-aa16-49f0-9f0a-aa33a1d9958f' },
    ]
  },

  {
    id: 'hmc',
    naam: 'HMC',
    type: 'ziekenhuis',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Klinische chemie en medische microbiologie',   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/187a96b4-830a-49da-973e-1393bbfe8759' },
      { label: 'Fertiliteit',                                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/bdf39a4c-d9cc-4441-a50a-92b9aa495a5b' },
      { label: 'Cervixcytologie (niet BVO)',                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d5fd3dac-9d3b-47c2-b2c6-2a37222250e3' },
      { label: 'Cytologie',                                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6a13ab3c-98d0-4e82-b7f9-3093dbce4d4d' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f3b8a60b-ab26-4b5e-8ad8-63ca60d061fe' },
    ]
  },

  {
    id: 'maasstad',
    naam: 'Maasstad Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Cervixcytologie',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/94e6929c-386a-491c-8721-ab99bf8f80e7' },
      { label: 'Cytologie',                                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2c51a74e-7049-47b1-ba33-ea7c87dcc4d1' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/49600042-c11b-4bae-972c-670d3c3a7806' },
      { label: 'Obductie',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/427ddb96-7c89-4ff5-b851-c2e1424339a4' },
    ]
  },

  {
    id: 'ikazia',
    naam: 'Ikazia Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Klinische chemie en Serologie (bloedafname)',  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/13b7d04d-311a-48c2-8e2f-33ac5585de43' },
      { label: 'Urinediagnostiek en overige materialen',       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1973ee53-331a-44da-924c-421ee15dc048' },
      { label: 'Prikaccident Huisarts',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/22c95263-7843-4f4b-9a3f-3c1d7b666bb9' },
      { label: 'KC en microbiologie HAP Numansdorp',           url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2c1e4add-5000-4cf4-829d-2b0369e4a910' },
    ]
  },

  {
    id: 'ijsselland',
    naam: 'IJsselland Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Klinische chemie / Infectie serologie',        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/07c0f039-3304-4498-92d9-f7591002a362' },
      { label: 'Point of care (gekoppeld)',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/4a51e645-4298-4a2a-9f67-f60c7606b025' },
      { label: 'Microbiologie',                                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3ccbe620-c6a1-4621-8f9a-3d71850a8e77' },
    ]
  },

  {
    id: 'franciscus',
    naam: 'Franciscus Gasthuis & Vlietland',
    type: 'ziekenhuis',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Klinische chemie en medische microbiologie',   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8867760f-42b5-4b22-8f0c-9aeac57bc880' },
    ]
  },

  {
    id: 'reinier_mdc',
    naam: 'Reinier MDC',
    type: 'ziekenhuis',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Laboratorium',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/73' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/293' },
      { label: 'Cervixcytologie',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/ca445900-6ffd-43fe-8322-35d94b3b0934' },
      { label: 'Cytologie',                                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0b450237-86b9-4869-bc24-49f196496f43' },
      { label: 'Cytologie HPV uitsluitend',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7021370e-76a1-4300-bc76-471d861eb545' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e6b8c103-ace0-47b6-a82f-ac3079431553' },
      { label: 'Obductie',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/15b9cf50-9b08-4e56-8dd9-92edd71354be' },
      { label: 'Aanmelding oproepdienst',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b42ae29f-f2fe-46d8-a4c4-8c82749415bd' },
    ]
  },

  {
    id: 'groene_hart',
    naam: 'Groene Hart Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'KCHL en MMB',                                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/34613e90-9e29-4876-945d-48a19b2ca03e' },
      { label: 'Point of Care Testing',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/57d8ba82-fb72-4dd9-a2af-e4302e774bcc' },
      { label: 'Cervixuitstrijk (medische indicatie)',          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6d1c8efc-ce8e-4464-9bb5-18d611935645' },
      { label: 'Cytologisch onderzoek',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3eb80047-11a2-4f15-8fb3-de6afbe3630f' },
      { label: 'Histologisch onderzoek',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6d588997-96e2-4396-852a-820bc880a122' },
      { label: 'Semen Fertiliteit',                            url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2376a649-fcc0-4fa3-b1d1-58fe7b99c39f' },
      { label: 'Semen na vasectomie',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e2d42fe6-482f-4f19-add3-8fc9196948e5' },
    ]
  },

  {
    id: 'antonius_nieuwegein',
    naam: 'St. Antonius Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Utrecht, Zuid-Holland',
    producten: [
      { label: 'Klinische Chemie, Medische Microbiologie en Immunologie', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e8e6da25-7d77-4649-ab32-c3a2beb82408' },
      { label: 'CRP point of care',                            url: 'https://www.zorgdomein.nl/zd/referral/choose-product/050ccca0-99fc-4ea8-8c12-b4b56b8535c6' },
      { label: 'Cervixcytologie',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/aa836b97-cf57-41ce-97a3-a9017db2e1c5' },
      { label: 'Cytologie',                                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a8daac5f-6ae2-41e1-897c-b9ab58f62b23' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d9b3cce9-6544-471f-9103-26a74e3eb17b' },
      { label: 'Obductie',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f4bc8cff-6e49-4cd6-aeb9-fa26ad1e5512' },
    ]
  },

  {
    id: 'diakonessenhuis',
    naam: 'Diakonessenhuis',
    type: 'ziekenhuis',
    provincie: 'Utrecht',
    producten: [
      { label: 'Klinische chemie, Medische microbiologie en immunologie (Diamid)', subtext: 'Vooralsnog geen huisbezoek mogelijk', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f0263c39-050b-4627-a214-5c0fba0ceb68' },
    ]
  },

  {
    id: 'tergooi',
    naam: 'Tergooi MC',
    type: 'ziekenhuis',
    provincie: 'Noord-Holland, Utrecht',
    producten: [
      { label: 'Klinische Chemie en Medische Microbiologie',   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/38c5533d-7562-4637-b4b0-705f91ffe195' },
      { label: 'Verloskundigen',                               url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0113ce37-091e-4a20-b081-031fb2a4872b' },
    ]
  },

  {
    id: 'gelderse_vallei',
    naam: 'Ziekenhuis Gelderse Vallei',
    type: 'ziekenhuis',
    provincie: 'Gelderland, Utrecht',
    producten: [
      { label: 'KCHL',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/fc761a7a-4daf-4e3f-be42-5422f5e69385' },
      { label: 'MMI',                                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/86e8831a-13e0-41ec-b712-82024e11852a' },
      { label: 'Fertiliteitsonderzoek',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/24f4c18d-bfaf-4e02-858c-ebf70a64a94a' },
      { label: '12e week screening',                           url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e3c54903-3894-47f7-9169-876d6e331eb6' },
      { label: '27e week screening',                           url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5e5a4f29-3c72-457f-80c6-ad01c8bb3d79' },
    ]
  },

  {
    id: 'meander',
    naam: 'Meander Medisch Centrum',
    type: 'ziekenhuis',
    provincie: 'Utrecht',
    producten: [
      { label: 'Klinische Chemie, Microbiologie en Immunologie', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/51d786ec-f6e1-4a9e-ae56-b485c498866f' },
      { label: 'Cervixcytologie Huisartsen',                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e33a2739-fa72-4555-b03e-68dea508db93' },
      { label: 'Histologie Pathologie',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5f294c40-128e-480d-a8c6-8590b471dffd' },
      { label: 'Cytologie Pathologie',                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/81706206-d955-445d-b2f6-4be7434efed6' },
      { label: 'Aanmelden Trombosedienst',                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1df21ff0-0b7c-4781-b70e-de9bf07c54a3' },
      { label: 'Afmelden Trombosedienst',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8216cacc-9ab3-41d8-a9b2-d4856801d70d' },
      { label: 'Meldingen Trombosedienst',                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/834253e0-6651-45e3-8cd4-eaea4e59df58' },
    ]
  },

  {
    id: 'flevoziekenhuis',
    naam: 'Flevoziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Flevoland',
    producten: [
      { label: 'Laboratoriumdiagnostiek',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/14f6633d-509f-432a-afd3-f6083ab3268a' },
      { label: 'Laboratoriumdiagnostiek, Urine 24 uurs',       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/bf104434-d856-4325-9b12-9a49ba7dc5fa' },
      { label: 'POCT (point-of-care testing)',                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/4c4fc53c-73b4-45c1-8cac-3504c31471a0' },
    ]
  },

  {
    id: 'st_jansdal',
    naam: 'Ziekenhuis St Jansdal',
    type: 'ziekenhuis',
    provincie: 'Flevoland, Gelderland',
    producten: [
      { label: 'Laboratorium huisarts',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/40' },
      { label: 'POCT huisartsen',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d45fe6bf-e272-4d8d-8dcf-ffe34031ce16' },
      { label: 'Aanmelding trombosedienst',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d54a6091-0c86-4e63-ba20-94c2a4324b91' },
      { label: 'Lab aanvragen \'s Heerenloo',                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8c900f3c-20ce-4cfe-9ae3-b3ee16c6ef9f' },
      { label: 'Lab aanvragen verloskundige',                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/57dd388d-368d-4568-9a0f-4700239337a4' },
      { label: 'Lab aanvragen Zorginstelling Getijde',         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/df6e49f8-57f9-44ba-9b8d-cb7e38764c74' },
      { label: 'Laboratorium Coloriet',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1f1cdcb7-9363-4047-9167-00b70d11cbed' },
      { label: 'Laboratorium KroonKliniek',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d078fb85-6488-4517-a6a0-bc1d63822b39' },
      { label: 'Laboratorium Woonzorg Flevoland',              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6e64a01c-0193-424f-a51c-cdd73e1c123e' },
      { label: 'Laboratorium WZU Veluwe',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d38aa5d0-cd3d-4ef1-8fe6-e97d8c992d5c' },
      { label: 'Ketenzorg CVRM + DM Medrie',                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/58db6515-ef2f-4f11-ad10-a285669eed98' },
      { label: 'Zorggroep Noordwest-Veluwe',                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/75a7d894-0c40-4587-bb2d-25ab2c79dc7d' },
      { label: 'Aanvraag protocollen labdiagnostiek',          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3a5011b6-6c7c-44cd-9eed-637dccf1dc98' },
      { label: 'Pathologie cervixuitstrijk (Harderwijk, samenwerking Isala)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/90c8b46c-bb5f-4004-9ce1-5220d9d013a8' },
      { label: 'Pathologie cytologie (Harderwijk, samenwerking Isala)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3d358bba-e45a-4a75-a8eb-d69fcd315aa9' },
      { label: 'Pathologie histologie (Harderwijk, samenwerking Isala)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5a9e4cfd-c30c-40f9-851f-4fef9f6b8bfb' },
      { label: 'Pathologie cervixuitstrijk (Lelystad, samenwerking Isala)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f11a8dd2-4f2a-4a05-98fc-3db17bca8d49' },
      { label: 'Pathologie cytologie (Lelystad, samenwerking Isala)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7f871d10-ad0d-4596-a94a-ebe79b8c482a' },
      { label: 'Pathologie histologie (Lelystad, samenwerking Isala)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/92f738a0-90d1-412b-bfdf-779ee7bc23bd' },
    ]
  },

  {
    id: 'rijnstate',
    naam: 'Rijnstate',
    type: 'ziekenhuis',
    provincie: 'Gelderland',
    producten: [
      { label: 'Dicoon - laboratoriumdiagnostiek',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/44' },
      { label: 'Dicoon - Oproepdienst (Huisarts)',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/209' },
      { label: 'Dicoon - POCT',                                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/210' },
    ]
  },

  {
    id: 'canisius',
    naam: 'Canisius-Wilhelmina Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Gelderland',
    producten: [
      { label: 'Laboratoriumonderzoek KCL en MMB',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1a69da17-e137-49f7-9744-15311fd41cff' },
      { label: 'Inschrijven KCL chronische zorg',              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e7ae2a99-cabd-45ea-829a-62f6a388c487' },
      { label: 'Pathologie cervixuitstrijkje',                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5d921896-684b-4278-be92-fcf460481b1e' },
      { label: 'Pathologie cytologie',                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2578995c-c12c-4eac-92b9-c9c8be6022a3' },
      { label: 'Pathologie histologie',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/10b665e8-b4a5-4c67-8c49-68119f1f106e' },
      { label: 'Pathologie obductie',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/18b6ca15-ec4d-47b8-a208-a7177c381590' },
    ]
  },

  {
    id: 'deventer',
    naam: 'Deventer Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Overijssel',
    producten: [
      { label: 'Klinische Chemie & Infectieserologie',         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/9b015e96-fea7-4b63-aac9-4dcb86cfa63e' },
      { label: 'Medische Microbiologie LMMI',                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6597b62f-2c31-4931-9c35-e92aa67349d1' },
      { label: 'Pathologie Cervix Cytologie',                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e131c1f2-c10c-40c7-a6a9-15361b853897' },
      { label: 'Pathologie Cytologie',                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/dcb1b77b-ae80-48a8-a77a-2cdc67730c4b' },
      { label: 'Pathologie Histologie',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/19f41f8a-d16b-466f-b0f4-fbfa7c9abda6' },
      { label: 'Pathologie Obductie',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0b6c371a-d552-400f-bdd9-441e58bc2656' },
    ]
  },

  {
    id: 'isala',
    naam: 'Isala',
    type: 'ziekenhuis',
    provincie: 'Overijssel, Drenthe',
    producten: [
      { label: 'Klinische Chemie en Infectieserologie',        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d27963b0-b97b-4629-a3f3-2bc4d9ce86b9' },
      { label: 'Klinische Chemie en Infectieserologie (kinderen <2 jaar)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/709b7d17-456f-4aee-beb6-a095d60f7065' },
      { label: 'Klinische Chemie en Infectieserologie (kinderen 2-7 jaar)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/14001c3d-c198-4c3f-a280-a8e5982900ef' },
      { label: 'Klinische Chemie en Infectieserologie (thuisprikken)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e207d2e0-1fc8-44d5-bf25-67ba2bccce3e' },
      { label: 'Klinische Chemie en Infectieserologie (zelfprikkende HA)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/97b1fd22-c398-46df-b689-7e8c550b14d9' },
      { label: 'Medische Microbiologie LMMI',                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/14fca067-76e5-4675-8eba-3afd6589f6ea' },
      { label: 'POCT CRP invoer',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0a872539-bd6f-4ecd-a082-743237661995' },
      { label: 'Pathologie cervixuitstrijk',                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/64ed2423-22af-4bb9-bc41-6d57ea8fea9b' },
      { label: 'Pathologie cytologie',                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/50a72453-8181-4272-b0da-aae9fb6e0cae' },
      { label: 'Pathologie histologie',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/adf5c51e-0dd8-43c1-bde1-45c049622234' },
      { label: 'Pathologie obductie',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/68a69a38-aebc-4812-81bf-eb97928636c4' },
      { label: 'Fundusfoto', subtext: 'Alleen regio Meppel/Steenwijk', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/897f30b7-7e09-47dd-b2b1-ebfbeb351119' },
    ]
  },

  {
    id: 'treant_scheper',
    naam: 'Treant (locatie Scheper)',
    type: 'ziekenhuis',
    provincie: 'Drenthe',
    producten: [
      { label: 'Klinische Chemie',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/93871490-6ff3-4a2e-9da0-534d87790da7' },
      { label: 'POCT op uw praktijk',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/01af6442-9510-43c9-9775-0fc267f8ab60' },
      { label: 'Cervix uitstrijk (medische indicatie)',         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/c9d68060-3165-4705-9db0-0615d9b1f75e' },
      { label: 'Cytologie',                                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6794c734-3558-4083-ba34-e1752c654621' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e1c66635-a72b-4fcf-94ef-b1466a15a6cb' },
      { label: 'Huisartsen Spoed Post',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3d37a522-cd4f-4e61-b5a3-4145b93317b3' },
    ]
  },

  {
    id: 'nij_smellinghe',
    naam: 'Nij Smellinghe',
    type: 'ziekenhuis',
    provincie: 'Friesland',
    producten: [
      { label: 'Algemeen',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/08af0a49-09bb-4509-b935-7d9a38246b43' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/63eb6086-488b-4a34-956d-0db4d7d00650' },
      { label: 'Semenonderzoek',                               url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f9d3e0ef-0ca2-4db4-a66c-c87183e57cbf' },
      { label: 'Verloskunde',                                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f505d87c-80bb-4f19-96db-e30144017256' },
      { label: 'Alliade',                                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/eb9058bc-50be-40d2-ab69-377c08713336' },
    ]
  },

  {
    id: 'viecuri',
    naam: 'VieCuri Medisch Centrum',
    type: 'ziekenhuis',
    provincie: 'Limburg',
    producten: [
      { label: 'Laboratoriumonderzoek',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/30fbc051-901c-4ba3-8b8d-291af1f58ec6' },
      { label: 'Medische Microbiologie',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d7e50ae1-ff62-4b26-ba2c-a6fb13e1f90e' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b7442a17-bd98-438b-bcd8-b8a508fda79e' },
      { label: 'Pathologie Cervixcytologie (indicatie)',        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2dce7d17-73fd-4fc3-bec2-e5aac19e3112' },
      { label: 'Pathologie Cytologie',                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/4c0eefa1-437c-4822-ad41-670b41a10ae5' },
      { label: 'Pathologie Histologie',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/16fecd21-e40c-4623-a3fd-69edb1d3af09' },
      { label: 'Pathologie Obductie',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e1b849fb-dcbd-4862-8df9-3ee9b3108b84' },
      { label: 'Stollingscentrum NOAC Aanmelding',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5536fe6e-bf85-4f7d-ab18-111cbd964d93' },
      { label: 'Trombosedienst Aanmelding',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/acb5e95c-4b78-45c2-adb8-71b8edacfe9b' },
      { label: 'Trombosedienst Afmelding',                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/bf9f33b0-065d-42a4-81d3-bcfc4c7bd392' },
    ]
  },

  {
    id: 'laurentius',
    naam: 'Laurentius Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Limburg',
    producten: [
      { label: 'Laboratorium',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/85' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a3f232ea-9ef5-4b5b-9307-3194b5d3f45c' },
      { label: 'Pathologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/66416ae4-5656-4080-8393-f50a3e56db56' },
    ]
  },

  {
    id: 'meditta_laurentius',
    naam: 'Meditta (Laurentius Ziekenhuis)',
    type: 'ziekenhuis',
    provincie: 'Limburg',
    producten: [
      { label: 'Laboratorium',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/87' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f5f17587-90d6-4a1d-82c1-358465f6b24e' },
      { label: 'Pathologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/eebd3c09-c907-4128-81fa-8031a08295b7' },
    ]
  },

  {
    id: 'meditta_sjg',
    naam: 'Meditta (SJG Weert)',
    type: 'ziekenhuis',
    provincie: 'Limburg',
    producten: [
      { label: 'Laboratoriumdiagnostiek',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1300328d-6b75-4c6d-9bef-3565b744d5cb' },
      { label: 'Nabepalingen klinische chemie',                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b164e20a-1887-447f-a379-577d1137e357' },
      { label: 'Pathologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7714637d-1dba-4349-976c-30a0d4794f5b' },
    ]
  },

  {
    id: 'zuyderland',
    naam: 'Zuyderland',
    type: 'ziekenhuis',
    provincie: 'Limburg',
    producten: [
      { label: 'Obductie (binnen en buiten kantoortijden)',     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/81efce10-9519-4e26-ba44-7581be31ee7d' },
    ]
  },

  {
    id: 'mumc',
    naam: 'Maastricht UMC+ (MUMC)',
    type: 'ziekenhuis',
    provincie: 'Limburg',
    producten: [
      { label: 'Eerste lijn',                                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/babc135a-23d7-4ac0-9b2a-f5c648b475b2' },
      { label: 'POCT aanvragen',                               url: 'https://www.zorgdomein.nl/zd/referral/choose-product/be20e680-4f0d-4f1b-98d7-1afed99d3efe' },
    ]
  },

  {
    id: 'elkerliek',
    naam: 'Elkerliek Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Laboratoriumonderzoek Algemeen',               url: 'https://www.zorgdomein.nl/zd/referral/choose-product/768ea7ab-b13a-44c5-b9b6-e85760e1192e' },
    ]
  },

  {
    id: 'catharina',
    naam: 'Catharina Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Laboratoriumdiagnostiek',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/35' },
      { label: 'D-dimeer indien positief echo beenvaten (DVT)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e0aedf2e-bb36-449d-85fc-69d629e98a2b' },
      { label: 'Farmacogenetica',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b28191f9-df6b-4ec1-9b6a-b85dba15ab9f' },
    ]
  },

  {
    id: 'jeroen_bosch',
    naam: 'Jeroen Bosch Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Laboratorium LKCH/MMB',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/892e2900-bfe6-421c-a9bb-a5b7cc119894' },
      { label: 'POCT op uw praktijk',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/cb9a13a0-675c-43cb-a154-1a31acbced8f' },
      { label: 'Nabepalingen',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/89fd1a33-9130-4eee-b2ac-a26c43ad8742' },
      { label: 'Semen',                                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/214a4a27-2637-402d-bdf4-8631e857629c' },
      { label: 'Pathologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/23cdb862-2ff3-4213-a092-5142d4993f5c' },
      { label: 'Aanmelden oproep chronische zorg',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7bd6a062-93f8-49c6-8c38-1890d5c20468' },
      { label: 'Afmelden/wijzigen oproep chronische zorg',     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a6a4c0f9-b055-4391-a79b-9438abbcbc7f' },
      { label: 'Aanmelden periodieke aanvragen',               url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d568d3c3-5d6d-464a-84eb-89114d09b7f4' },
      { label: 'Afmelden periodieke aanvragen',                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/98e33571-c56f-469a-9a9e-d5d53c3ea335' },
    ]
  },

  {
    id: 'bernhoven',
    naam: 'Ziekenhuis Bernhoven',
    type: 'ziekenhuis',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Laboratorium',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/71' },
      { label: 'MMB uitgevoerd door JBZ',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/289576cf-8134-43db-bb06-409f7e54f5d3' },
      { label: 'Aanmelden Oproepdienst',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/60bb2cb1-2f57-4359-8f19-1adf8ab566a0' },
      { label: 'Afmelden Oproepdienst',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/74969440-fe2d-48ab-b888-da27d61bea94' },
      { label: 'Oproepdienst radiologie',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/24454' },
      { label: 'Trombosedienst aanmelden',                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/24463' },
      { label: 'Trombosedienst afmelden',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/24464' },
      { label: 'VKA naar DOAC/NOAC overzetten (trombosedienst)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/151f310b-cd63-48a3-aed7-b330f9d2c569' },
    ]
  },

  {
    id: 'amphia',
    naam: 'Amphia',
    type: 'ziekenhuis',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Cytologie',                                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/86376ea5-88d3-4b45-bdfb-d3b0d208cf42' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/49b81bc8-62d1-448e-a54b-95eb7458b0dc' },
      { label: 'Obductie',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e944da99-7d69-4c75-b544-493cb0a6ffb7' },
      { label: 'Portiocytologie',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f466f94d-d1c1-45bb-91ce-bd77002cb795' },
    ]
  },

  {
    id: 'van_weel_bethesda',
    naam: 'Van Weel-Bethesda Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Hematologie en Klinische Chemie',              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/ff1d04e6-d1f2-45fd-aa96-1be13999b9f0' },
      { label: 'Lab Zorg en Verpleging Curamare',              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a02a3a5f-502a-456e-b639-8680d88461b4' },
      { label: 'Invoeren uitslagen POCT',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6fa030c7-a3d8-481e-92c3-58cf7197fdc5' },
      { label: 'Aanmelden Chronische Zorg',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f22e11db-1a19-4899-aac0-286fa8602027' },
      { label: 'Wijzigen/afmelden Chronische zorg',            url: 'https://www.zorgdomein.nl/zd/referral/choose-product/bb2f4683-1cb7-48f6-bd96-d06020c2fcb2' },
      { label: '12e week screening',                           url: 'https://www.zorgdomein.nl/zd/referral/choose-product/9c4fe4b9-e10c-4c98-8f04-d88fb736c3f7' },
      { label: '27e week screening',                           url: 'https://www.zorgdomein.nl/zd/referral/choose-product/516c6631-98cf-495c-9390-df69986c158c' },
    ]
  },

  {
    id: 'streekziekenhuis_kb',
    naam: 'Streekziekenhuis Koningin Beatrix',
    type: 'ziekenhuis',
    provincie: 'Gelderland',
    producten: [
      { label: 'Laboratorium',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3aa6e6be-1ba8-4247-a81e-b9671416404d' },
    ]
  },

  {
    id: 'anna_ziekenhuis',
    naam: 'Anna Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Laboratoriumonderzoek',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/700142f5-86ec-45ba-87da-96f82463d9ab' },
      { label: 'Laboratoriumonderzoek farmacogenetica',        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/57d83a4e-7cba-4dc9-a400-6d2bfd35a8fa' },
      { label: 'D-dimeer indien positief echo beenvaten (DVT)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e1a1a77e-f6b6-4c7a-9bbe-12ceb716f117' },
      { label: 'Aanmelden oproepdienst',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/11aeb82f-8b0d-4811-a5fc-c1816d30992d' },
    ]
  },

  {
    id: 'maxima_mc',
    naam: 'Maxima Medisch Centrum',
    type: 'ziekenhuis',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Laboratoriumonderzoek 1e lijn',                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/29' },
      { label: 'Laboratoriumonderzoek voor Lunetzorg',         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/30' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/32' },
      { label: 'POCT SHOKO',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7b8d9120-4199-418c-a206-048841eed8be' },
      { label: 'D-Dimeer indien positief echo beenvaten (DVT)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f3555afb-0206-4577-8cb8-072febf66c4e' },
    ]
  },

  {
    id: 'antonius_ziekenhuis',
    naam: 'Antonius Ziekenhuis (Sneek)',
    type: 'ziekenhuis',
    provincie: 'Friesland',
    producten: [
      { label: 'Klinische Chemie',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d9473ef9-3e11-4a2b-a4de-63a722228565' },
      { label: 'Verpleeghuizen (Klinische Chemie)',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0997a0fb-30db-40ee-adb9-ab70065b1052' },
      { label: 'Ketenzorg Flevoland',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e4cd8976-fdaa-42e2-82a9-309272cc6b11' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f88d2be9-24e6-4eaf-8e00-e59de1b36242' },
      { label: 'POCT via POCcellerator',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a3e0a7a3-9d1a-413f-8fe7-fe0c7ab63fcd' },
    ]
  },

  {
    id: 'noordwest_ziekenhuisgroep',
    naam: 'Noordwest Ziekenhuisgroep',
    type: 'ziekenhuis',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'KCL / infectieserologie (Starlet)',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/acf00899-d314-4871-b99c-b4d20e57df30' },
      { label: 'MMB (Starlet)',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/724d2915-003c-47f6-9f6d-bedcf2ffc8dc' },
      { label: 'Mammografie via BOB/BVO (Alkmaar)',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3cdd3c39-d6fe-4f86-8c8f-45af1759f15d' },
      { label: 'Mammografie via BOB/BVO',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/caf6fe0b-eab9-40df-842c-712c2e2f0ec7' },
    ]
  },

  {
    id: 'spaarne_gasthuis',
    naam: 'Spaarne Gasthuis',
    type: 'ziekenhuis',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Pathologie cervixuitstrijk',                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8ee88d2e-5217-4860-bec1-d3070463818a' },
      { label: 'Pathologie cytologie',                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/24a30f40-47b9-448e-a57e-c2b32edb23b5' },
      { label: 'Pathologie histologie',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/44e4f2db-36ac-45a6-8265-43d4dd85bcff' },
    ]
  },

  {
    id: 'bovenij',
    naam: 'BovenIJ Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Laboratorium KCL',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/48a1bb5f-2882-4193-8045-72b7e50d2a09' },
      { label: 'Laboratorium Microbiologie',                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f92ef759-3d4c-4a51-8662-c0f402bc022e' },
      { label: 'CRP POCT',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7f7a85c1-980b-4d40-b986-bc7d9e593bed' },
    ]
  },

  {
    id: 'olvg',
    naam: 'OLVG',
    type: 'ziekenhuis',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Laboratoriumdiagnostiek locatie Oost',         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/513bb44f-7718-4b4a-b157-0b7551e4f71d' },
      { label: 'Laboratoriumdiagnostiek locatie West',         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/494792d5-0485-482c-88e4-995615dee978' },
      { label: 'POCT (point-of-care testing)',                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a8048e2c-fc3c-4306-ba8e-8b31d57f0762' },
      { label: 'Laboratoriumdiagnostiek, Urine 24-uurs',       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e03cf379-58e9-45cb-9be0-54ce2caf33bc' },
    ]
  },

  {
    id: 'martini',
    naam: 'Martini Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Groningen',
    producten: [
      { label: 'Cytologie cervix op medische indicatie',       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/161fe4f4-274b-4d9c-8356-0a104b2fc429' },
      { label: 'Cytologie niet-cervix',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/145f3168-e6f2-4dc9-9219-f8b918e5fce4' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/daa2be8c-31ed-4a0d-ab1e-acb01dc61858' },
    ]
  },

  {
    id: 'umcg',
    naam: 'UMCG',
    type: 'ziekenhuis',
    provincie: 'Groningen',
    producten: [
      { label: 'Cytologie - niet cervix',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8992' },
      { label: 'Cytologie cervix',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8995' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8994' },
      { label: 'Obductie',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8993' },
    ]
  },

  {
    id: 'ziekenhuis_rivierenland',
    naam: 'Ziekenhuis Rivierenland',
    type: 'ziekenhuis',
    provincie: 'Gelderland',
    producten: [
      { label: 'KCL',                                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0b78b01a-eb80-478b-a4b8-c88159f9dbd7' },
      { label: 'MMB',                                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3effcc16-04c6-42b3-8bee-60b4dcaadc73' },
      { label: 'POCT op uw praktijk',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2b77173e-4499-4416-8f16-b91c94b50ebb' },
    ]
  },

  {
    id: 'rode_kruis',
    naam: 'Rode Kruis Ziekenhuis',
    type: 'ziekenhuis',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Klinische chemie',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/89b7699c-e997-4ed2-949f-813b012b815a' },
    ]
  },

  {
    id: 'adrz',
    naam: 'Admiraal de Ruyter Ziekenhuis (ADRZ)',
    type: 'ziekenhuis',
    provincie: 'Zeeland',
    producten: [
      { label: 'Aanmelden trombosedienst',                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3ee1db73-c8dc-412d-a65e-b43f538f6bf0' },
      { label: 'Afmelden trombosedienst',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/865d6572-afad-470f-bec3-6ddf4d076d78' },
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LABORATORIA
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'saltro',
    naam: 'Saltro Diagnostisch Centrum',
    type: 'laboratorium',
    provincie: 'Utrecht',
    producten: [
      { label: 'Laboratorium Saltro',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/42160776-0906-4c16-84c0-f04301c5ea27' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/257' },
      { label: 'Cytologisch onderzoek',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/19138' },
      { label: 'Histologisch onderzoek',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/19137' },
      { label: 'Huisartsen Utrecht Stad',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/222' },
      { label: 'GHC Maarssenbroek',                            url: 'https://www.zorgdomein.nl/zd/referral/choose-product/220' },
      { label: 'Unicum Huisartsenzorg',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/221' },
      { label: 'Diagnostisch Centrum Houten (DCH)',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8981e7fb-4353-43f5-831d-0a5a2ceda47b' },
      { label: 'Verloskunde',                                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2741c68b-9057-44f7-8fbc-2bd3706f0257' },
    ]
  },

  {
    id: 'result_amphia',
    naam: 'Result Laboratorium (Amphia)',
    type: 'laboratorium',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Klinische Chemie & Microbiologie',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b3e7d1c9-93b1-4688-8ff1-2e2e19e1c743' },
      { label: 'Labdiagnostiek VVT Breda e.o.',                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/151fc7cf-a495-40fd-a589-a5645ba04e28' },
      { label: 'Aanmelding bewaking- en oproepdienst',         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e32a9961-2827-4251-b493-1968d8ce5880' },
    ]
  },

  {
    id: 'result_albert_schweitzer',
    naam: 'Result Laboratorium (Albert Schweitzer)',
    type: 'laboratorium',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Klinische chemie & Microbiologie',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b42b6504-4c75-431d-99b1-9d60dcfb6ebf' },
      { label: 'DrechtDokters',                                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/93' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/63e01ecd-71aa-441b-bb14-f1783afdf19d' },
      { label: 'Aanmelden oproepdienst Cadans',                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3d5cc527-6223-41e2-aa1e-a7cb6a9a36da' },
      { label: 'Aanmelding Trombosedienst',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/ef95e89b-9dc9-48de-9884-1235c06f5794' },
      { label: 'Cytologie cervix uitstrijk (PAL)',              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/99abbb0e-49f1-41ed-ae1a-e669d3c89f51' },
      { label: 'Histologie (PAL)',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8fb89614-7d0b-41a4-9f40-c10469cc67ab' },
    ]
  },

  {
    id: 'result_beatrix',
    naam: 'Result Laboratorium (Beatrixziekenhuis)',
    type: 'laboratorium',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Klinische chemie & Microbiologie',             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/9db79d0d-8de6-45f5-8138-967153757ab5' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f89a7a71-8ff4-44f0-817d-3644cdfac3fb' },
      { label: 'Aanmelden oproepdienst Cadans',                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0d6ec017-ee19-4db4-b1a3-718d67c74e2d' },
      { label: 'Aanmelding Trombosedienst',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/58f645cd-f290-4b4f-87d8-f501bdadf667' },
      { label: 'Cytologie cervix uitstrijk (PAL)',              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d80cdf26-78ce-48f2-928e-6449de8df8c3' },
      { label: 'Histologie (PAL)',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b951709f-cb01-4b4c-a8da-7f2bee42e41c' },
    ]
  },

  {
    id: 'star_shl',
    naam: 'Star-shl',
    type: 'laboratorium',
    provincie: 'Zuid-Holland, Noord-Brabant, Zeeland',
    producten: [
      { label: 'Laboratoriumonderzoek',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3006b4fb-4668-4202-9254-85ce78407918' },
      { label: 'Laboratoriumonderzoek - Nabepalingen',         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/89184989-9e3b-4aeb-a255-9cf4d2e95849' },
      { label: 'Laboratoriumonderzoek - POCT',                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/af44a1af-808a-4553-bad9-9036a9e77049' },
      { label: 'Trombosedienst - Aanmelden',                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/91611693-be04-4541-ad59-1dab08fd8e21' },
      { label: 'Trombosedienst - Afmelden',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/c3ce8445-92b8-4576-b034-46dd105b91a6' },
      { label: 'Oproepdienst chronische aandoeningen (Rijnmond)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e9df355a-bcb8-4ee8-9f6e-7d19075972da' },
      { label: 'Oproepdienst chronisch medicijngebruik (Rijnmond)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/ae85e455-07dd-483a-a78a-4d77c32a103d' },
      { label: 'Oproepdienst chronische aandoeningen (Brabant/Zeeland/Haaglanden)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/265c7246-8d47-4155-a44a-f2fe2be7ad3b' },
      { label: 'Oproepdienst chronisch medicijngebruik (Brabant/Zeeland/Haaglanden)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/74a5f57e-50c5-4a6f-809f-7b4b902dcb48' },
      { label: 'Oproepdienst staken (Brabant/Zeeland/Haaglanden)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7fb5110e-3910-4e98-86ae-f147339eb0c0' },
    ]
  },

  {
    id: 'maasstad_lab',
    naam: 'Laboratorium Maasstad / Spijkenisse MC',
    type: 'laboratorium',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'MaasstadLab',                                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3b2d9104-a0ad-4f49-b042-8782717b0e8d' },
      { label: 'MaasstadLab (locatie Maasstad)',                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/fa94ab51-78c5-4020-aa38-ee35b8d00b98' },
      { label: 'Nabepalingen',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/81ca3684-bf75-4bf4-8038-fb68815829c6' },
      { label: 'Nabepalingen (locatie Maasstad)',               url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5e4bd86f-36e5-4db2-bfd4-0d5da3bde9d4' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8aaef582-f5b4-491c-9e83-bce99e2cb0d1' },
      { label: 'POCT (locatie Maasstad)',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/323271d9-e57f-4c5b-a40c-05f8f04776b2' },
      { label: 'Farmacogenetica',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/357f86d4-1e33-4e34-8d05-ce8f9a3c1c3b' },
      { label: 'Farmacogenetica (locatie Maasstad)',            url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e2be0bf2-0e86-4d77-a1db-5f49556c1eea' },
      { label: 'Maasstadlab incl. thuisprikken', subtext: 'Alleen voor HAP Cityplaza', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/40822f3c-4e8f-4357-ac2d-db584c25a429' },
      { label: 'Maasstadlab incl. thuisprikken', subtext: 'Alleen voor HAP Blankenburg', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/be1a67be-0843-454c-bf8d-109a0d04dbe0' },
      { label: 'Maasstadlab incl. thuisprikken', subtext: 'Alleen voor HAP Bolnes', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/63459af1-2bc8-41d2-8bcf-2f486b79ac84' },
      { label: 'Aanmelden chronische zorg', subtext: 'Alleen voor HAP Blankenburg', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/32edce13-f2e6-4eaf-9a7c-2f1b036a2a32' },
      { label: 'Afmelden chronische zorg', subtext: 'Alleen voor HAP Blankenburg', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7caf4bcb-e27c-4481-9ea0-fa68bde8ecdb' },
    ]
  },

  {
    id: 'diagnostiek_voor_u',
    naam: 'Diagnostiek voor U',
    type: 'laboratorium',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Klinische chemie en microbiologie',            url: 'https://www.zorgdomein.nl/zd/referral/choose-product/4e5d3dc9-6255-49d2-983e-dfa2e81a007a' },
      { label: 'POCT',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b44aad52-57f6-43f1-805e-fa5587b124f4' },
      { label: 'dokter&diagnostiek (HA-groep)',                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b8e06ff2-33f6-4c6e-8fbc-72f4395c8a29' },
      { label: 'dokter&diagnostiek POCT',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0acd0956-6e6d-486e-bf5c-8c29a0759990' },
      { label: 'Nabepalingen',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e58ddd6b-913b-40fc-8df5-0b68b4ad4b68' },
      { label: 'Pathologie cervixuitstrijk',                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/fba9ac2d-a19b-45c5-a78a-bb2c9e260a25' },
      { label: 'Pathologie histologie',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/c66ad436-a423-4c6a-b590-d0e7d4d7994f' },
      { label: 'Pathologie cytologie in urine',                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/072f7b84-d734-42f9-89b3-009ab57049d0' },
      { label: 'Farmacogenetica',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/73c21b75-75ea-4bb1-a57b-93b3adbb191c' },
      { label: 'Oproepdiensten chronische zorg',               url: 'https://www.zorgdomein.nl/zd/referral/choose-product/ba71662e-bc78-4466-9349-973ec308e19b' },
    ]
  },

  {
    id: 'diagnovum_bravis',
    naam: 'Diagnovum (Bravis Ziekenhuis)',
    type: 'laboratorium',
    provincie: 'Noord-Brabant, Zeeland',
    producten: [
      { label: 'KCHLT Bravis + MMB Microvida',                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/085f63a1-fc7f-4f06-a84c-f4a5b51e620e' },
      { label: 'POCT Diagnovum Bravis',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/863537ec-cae7-4da2-a357-8bf56b034925' },
      { label: 'Cervixuitstrijk West-Brabant',                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/c404c363-8b30-46f1-8d53-7d43d5f39c4a' },
      { label: 'Cytologie West-Brabant',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2292baef-5a22-40e5-b23b-189de04b27e9' },
      { label: 'Histologie West-Brabant',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e945471a-863a-41ac-900a-80e3e5419e09' },
      { label: 'Aanmelden oproepsysteem',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/44b10fd8-937f-4c70-8d80-a5b2489095fa' },
      { label: 'Afmelden/wijzigen oproepsysteem',              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b0b6aea2-b1dd-4524-a66c-da75d80b6602' },
      { label: 'Cadans - Nieuwe patiënt registreren',          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/bd0a575b-c2f6-44ce-bd2e-825151cd5cb4' },
    ]
  },

  {
    id: 'diagnovum_adrz',
    naam: 'Diagnovum (ADRZ)',
    type: 'laboratorium',
    provincie: 'Zeeland',
    producten: [
      { label: 'KC + MMI',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1805e51d-7288-46c4-ad86-476649913bef' },
      { label: 'POCT Diagnovum ADRZ',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/de277807-512d-49c1-86b4-a0ebf1c841b3' },
      { label: 'Aanmelden oproepsysteem',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0d84681c-6337-499e-be75-0a96002aa7b0' },
      { label: 'Afmelden/wijzigen oproepsysteem',              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/4a0708c7-e5c0-485f-a3ac-8d4e16302121' },
      { label: 'Cadans - Nieuwe patiënt registreren',          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/486e6768-aad6-465c-8a55-13334b172ecc' },
    ]
  },

  {
    id: 'diagnovum_zorgsaam',
    naam: 'Diagnovum (ZorgSaam)',
    type: 'laboratorium',
    provincie: 'Zeeland',
    producten: [
      { label: 'KC (ZorgSaam) + MMB (Microvida)',               url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b243cee4-a367-4529-b023-5b9e6932041b' },
      { label: 'POCT Diagnovum ZorgSaam',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0008b79c-d16a-44de-a2e9-39070d72667c' },
      { label: 'Aanmelden oproepsysteem',                      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/96f0dcd5-7bf4-4961-9a59-683be504685f' },
      { label: 'Afmelden/wijzigen oproepsysteem',              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/fa5bcefc-861b-4a8f-93b8-89253353fa32' },
      { label: 'Cadans - Nieuwe patiënt registreren',          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/cbe87816-0848-47c6-95ea-e5ab13ad0b7e' },
    ]
  },

  {
    id: 'diagnovum_midden_brabant',
    naam: 'Diagnovum (Midden Brabant)',
    type: 'laboratorium',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Laboratorium Midden Brabant',                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/be5ea56d-c116-4dd3-aa0b-521cd6b5f5e9' },
      { label: 'Laboratorium Midden Brabant Nabepaling',       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/763d37e4-c9dc-493f-9098-0661a4e99b92' },
      { label: 'POCT Diagnovum Midden Brabant',                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/ee4ca884-2a90-4762-96b3-9f151282534b' },
      { label: 'Cadans - Nieuwe patiënt registreren',          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/225f1521-2af1-45d0-a767-12e721c7925b' },
    ]
  },

  {
    id: 'diagnovum_amphia',
    naam: 'Diagnovum (Amphia)',
    type: 'laboratorium',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Amphia KCL + MMB',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5798cf50-1fe3-4825-b5f8-a858c04901fe' },
      { label: 'POCT Diagnovum Amphia',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a846558c-4060-4665-9b9d-ecb76e8a183b' },
      { label: 'POCT Diagnovum Amphia Ginnekenweg',            url: 'https://www.zorgdomein.nl/zd/referral/choose-product/374d6b1e-2fe0-4bfc-afc3-d4b690ed7dba' },
      { label: 'Laboratorium Amphia-Result Nabepaling',        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/055acf11-0fc2-4b4a-9bf6-0de23ca48afc' },
      { label: 'Cadans - Nieuwe patiënt registreren',          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/213a64e9-c729-49a4-ad2d-387bf2228f27' },
    ]
  },

  {
    id: 'labpon',
    naam: 'LabPON',
    type: 'laboratorium',
    provincie: 'Overijssel',
    producten: [
      { label: 'Cervixuitstrijk',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0880edec-b5d0-4b5f-a5be-46f7f4c7da54' },
      { label: 'Cytologie',                                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/ff4a8a79-7969-4e92-8ccd-f5bfff00cc10' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/117e3f44-4ffe-4b1f-a89c-3a62ba403876' },
      { label: 'Obductie',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/80e2bab2-7bcb-485e-8cfa-6845bb1fd11c' },
    ]
  },

  {
    id: 'labmicta',
    naam: 'Labmicta',
    type: 'laboratorium',
    provincie: 'Overijssel',
    producten: [
      { label: 'Medische microbiologie',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7180e407-d381-48cb-bdae-03b8fe388d48' },
    ]
  },

  {
    id: 'medlon',
    naam: 'Medlon',
    type: 'laboratorium',
    provincie: 'Overijssel',
    producten: [
      { label: 'Klinische chemie',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/ae48e6d3-b7d1-4829-ad73-5bd79b40874a' },
      { label: 'Point of care testing',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5ded522f-b7fe-4d82-9a7d-313276a8c30b' },
      { label: 'Liberein',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a5d86dfa-efb8-49b1-93ca-6ae164017d34' },
      { label: 'Twentse Zorgcentra',                           url: 'https://www.zorgdomein.nl/zd/referral/choose-product/136994b6-df9d-48dd-845d-48791e453410' },
    ]
  },

  {
    id: 'pamm',
    naam: 'Laboratorium PAMM',
    type: 'laboratorium',
    provincie: 'Noord-Brabant',
    producten: [
      { label: 'Medische microbiologie',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/01cf8496-c0ce-4cad-af68-58b5cdf777c4' },
      { label: 'Cervixuitstrijk',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/16688088-94fd-4340-bd23-bf3c29ff6714' },
      { label: 'Cytologie',                                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0aead3e8-b39d-490c-b043-1b02f13602a4' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6c8ce9ac-7727-4e70-aa2e-55131b69b42f' },
    ]
  },

  {
    id: 'certe',
    naam: 'Certe',
    type: 'laboratorium',
    provincie: 'Groningen, Friesland, Drenthe',
    producten: [
      { label: 'Regulier',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/dd366761-8a24-4da2-96f0-b0aa772580a6' },
      { label: 'POCT geautomatiseerde/gekoppelde verwerking',  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/81' },
      { label: 'POCT handmatig invoer',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/73f22ee9-aeb3-4f85-994a-cc60630f5fcf' },
      { label: 'Prenatale aanvragen',                          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/02ed0147-de39-4c1f-b692-7cba399d56d7' },
      { label: 'Behandelplan',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/990abcb6-7020-425b-8bdd-5dd0afdf41f7' },
    ]
  },

  {
    id: 'pathologie_friesland',
    naam: 'Pathologie Friesland',
    type: 'laboratorium',
    provincie: 'Friesland',
    producten: [
      { label: 'Cervixcytologie',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/c6787dc6-b860-420e-bf45-06fdb8b901de' },
      { label: 'Cytologie',                                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8bf74f69-208a-4536-b228-230107121158' },
      { label: 'Histologie',                                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/57faf7cc-ff49-4fc9-b23c-49114a02454a' },
      { label: 'Obductie',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/4bf22e93-cac0-4531-87be-eed8ebd31f67' },
    ]
  },

  {
    id: 'streeklab_haarlem',
    naam: 'Streeklab Haarlem',
    type: 'laboratorium',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Medische Microbiologie',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/e84e7f22-60a3-4158-ac1a-a2d9acb9b7a5' },
      { label: 'VVT Medische Microbiologie',                   url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8a474b2f-654b-418c-b443-dc8edbaa6f9a' },
      { label: 'VVT Medische Microbiologie met locatiekeuze',  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/40d77a36-4858-46ab-b72f-2f7fbe5ac38e' },
      { label: 'VVT Medische Microbiologie barcodes',          url: 'https://www.zorgdomein.nl/zd/referral/choose-product/eabe7a9a-dd36-407a-a274-439ed4f0a6e9' },
      { label: 'VVT Medische Microbiologie barcodes + locatiekeuze', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b7a85cb2-a8c2-4bac-8f19-a40e249a80ef' },
    ]
  },

  {
    id: 'atalmedial_amsterdam',
    naam: 'Atalmedial Amsterdam',
    type: 'laboratorium',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Klinische chemie en Medische microbiologie (AMS)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/c67c32ae-4656-4a3d-9b9a-73d3fee2941d' },
    ]
  },

  {
    id: 'atalmedial_kennemerland',
    naam: 'Atalmedial Kennemerland (Haarlem)',
    type: 'laboratorium',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Klinische chemie (KEN)',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/4bc9118c-fb90-416a-b9e4-9deefe5a3487' },
      { label: 'SEIN',                                         url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8209663e-b1c1-4eea-b381-be7ad59a905e' },
    ]
  },

  {
    id: 'atalmedial_amstelland',
    naam: 'Atalmedial Amstelland / Leiden',
    type: 'laboratorium',
    provincie: 'Noord-Holland, Zuid-Holland',
    producten: [
      { label: 'Klinische chemie en medische microbiologie (CLA)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/c6b85567-1d94-4a98-afcf-7224df0fdbbc' },
    ]
  },

  {
    id: 'atalmedial_flevoland',
    naam: 'Atalmedial Flevoland',
    type: 'laboratorium',
    provincie: 'Flevoland',
    producten: [
      { label: 'Klinische chemie (FLV)',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/9bd04c96-4439-4f20-84d2-6888c3e2056c' },
    ]
  },

  {
    id: 'diagnost_iq_purmerend',
    naam: 'Diagnost-IQ Purmerend',
    type: 'laboratorium',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Klinische chemie',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1d64a816-6fdf-4ba6-961d-503b1f8ef915' },
      { label: 'POCT aanvraag',                                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/922e0a52-3c08-4c4f-9c9b-24d599610f5f' },
    ]
  },

  {
    id: 'diagnost_iq_zaandam',
    naam: 'Diagnost-IQ Zaandam',
    type: 'laboratorium',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Klinische Chemie',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b58a3115-b527-4f2e-b1bd-383ff83f7ad1' },
      { label: 'POCT aanvraag',                                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0fe93ae8-dfec-473e-8b57-bb78ff317fc3' },
    ]
  },

  {
    id: 'diagnost_iq_hoorn',
    naam: 'Diagnost-IQ Hoorn',
    type: 'laboratorium',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Klinische chemie',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/959e616c-0408-4214-b175-d32bc8893cca' },
      { label: 'POCT aanvraag',                                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6797a50d-5619-4505-9db5-29f84c35279e' },
    ]
  },

  {
    id: 'sho',
    naam: 'SHO Centra voor medische diagnostiek',
    type: 'laboratorium',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Laboratorium SHO',                             url: 'https://www.zorgdomein.nl/zd/referral/choose-product/63' },
      { label: 'SHO POCT',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/64' },
      { label: 'Microbiologie',                                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/fbfa13e4-fcc7-4343-ae2b-abcf9d951d07' },
      { label: 'Oproepdienst',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0664e579-f726-456f-90ad-5337dd03dc5f' },
    ]
  },

  {
    id: 'scal',
    naam: 'SCAL Medische Diagnostiek',
    type: 'laboratorium',
    provincie: 'Zuid-Holland',
    producten: [
      { label: 'Laboratorium KC (papierloos)',                  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d765e5b5-0e36-4af2-9b60-f3df5b8013c7' },
      { label: 'Microbiologie',                                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6fac6395-080b-4baf-9f71-d5575471456e' },
      { label: 'Microbiologie (GGZ Rivierduinen)',              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5c0c4cee-c117-4894-9469-ba548cfe5486' },
      { label: 'Zorginstellingen KC (WLZ patiënten)',           url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f2a1284d-4489-4ce2-9ec8-ddb08d6afd58' },
      { label: 'Laboratorium KC (GGZ)',                        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6e3a9b49-ea8f-4067-b838-e2145d69e105' },
      { label: 'Afmelden chronische zorg',                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1b38b658-77f2-4171-aee8-db9ff8892a5d' },
      { label: 'Lab diagnostiek oproepdienst chronische aandoening', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d4f581f5-7314-4de8-b53e-163f661bee65' },
    ]
  },

  {
    id: 'salt',
    naam: 'SALT',
    type: 'laboratorium',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Laboratorium',                                 url: 'https://www.zorgdomein.nl/zd/referral/choose-product/5e17df07-04a3-4363-a509-557c547b0751' },
      { label: 'Medisch Microbiologie (banale kweek, SOA en feces)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/7afb5c5e-24d8-4362-9e0e-16b16113c8de' },
      { label: 'Laboratorium (Amsterdam)',                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6ef0b4d7-a18b-4cae-a5af-2aff43f95573' },
      { label: 'Medisch Microbiologie Amsterdam (banale kweek, SOA en feces)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/9880c2c7-be07-4fd5-b789-6e2b932a842c' },
    ]
  },

  {
    id: 'comicro',
    naam: 'Comicro Microbiologie',
    type: 'laboratorium',
    provincie: 'Noord-Holland',
    producten: [
      { label: 'Microbiologie',                                url: 'https://www.zorgdomein.nl/zd/referral/choose-product/6ef1d4b8-a65b-4bbb-87aa-dadc14cb52cc' },
      { label: 'Microbiologie met barcode scanner',            url: 'https://www.zorgdomein.nl/zd/referral/choose-product/a9909fd6-592f-422f-bb8a-75210a1d478c' },
    ]
  },

  {
    id: 'prikservice',
    naam: 'Prikservice',
    type: 'laboratorium',
    provincie: 'Utrecht, Flevoland',
    producten: [
      { label: 'Klinische chemie / Infectie serologie (Triade Vitree)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/3603a562-07e7-4e36-b0d5-3407f0d686e7' },
      { label: 'Medische microbiologie',                       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/29df859c-9921-41b1-a112-4d145f5a8168' },
      { label: 'Thuisafname klinische chemie / infectie serologie', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/72ef7452-dab2-4d3a-8148-a436a204385d' },
    ]
  },

  {
    id: 'pangenix',
    naam: 'PanGenix',
    type: 'laboratorium',
    provincie: 'Landelijk',
    producten: [
      { label: 'Farmacogenetica',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/ea658562-6d0a-472a-8d95-daa71928ab13' },
    ]
  },

  {
    id: 'zorgsaam_zeeuws_vlaanderen',
    naam: 'ZorgSaam Zorggroep Zeeuws-Vlaanderen',
    type: 'laboratorium',
    provincie: 'Zeeland',
    producten: [
      { label: 'POCT CRP',                                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1c5c36e1-399a-48c8-a409-097308ced5e1' },
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OVERIG (landelijk werkende instellingen)
  // ─────────────────────────────────────────────────────────────────────────

  {
    id: 'bvo_baarmoederhalskanker',
    naam: 'Bevolkingsonderzoek baarmoederhalskanker',
    type: 'overig',
    provincie: 'Landelijk',
    producten: [
      { label: 'Uitstrijk bevolkingsonderzoek baarmoederhalskanker (BVO)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/10156d2b-9d91-499b-813e-fd981e37ea2f' },
    ]
  },

  {
    id: 'nifgo',
    naam: 'niFGo (Farmacogenetisch Onderzoek)',
    type: 'overig',
    provincie: 'Landelijk',
    producten: [
      { label: 'Pakket 1 - Multigenen conform richtlijn',      url: 'https://www.zorgdomein.nl/zd/referral/choose-product/be06ed16-b0bf-409e-a9f1-d491fa35892b' },
      { label: 'Pakket 2 - Cardiovasculaire medicatie',        url: 'https://www.zorgdomein.nl/zd/referral/choose-product/64c3e6a1-0480-4e13-a21c-827afb8d6784' },
      { label: 'Pakket 3 - Psychofarmaca',                     url: 'https://www.zorgdomein.nl/zd/referral/choose-product/eee07f11-6e92-4d36-b9a4-c1c914072941' },
      { label: 'Pakket 4 - HLA-typering bij medicatieveiligheid', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/420cc9ef-e6a6-4c07-8bc0-2355c2aec05f' },
    ]
  },

  {
    id: 'erasmus_mc_farmacogenetica',
    naam: 'Erasmus MC (Farmacogenetica)',
    type: 'overig',
    provincie: 'Landelijk',
    producten: [
      { label: 'Farmacogenetica',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/15613961-7a84-4693-89a9-cc6f6070e7aa' },
    ]
  },

  {
    id: 'ccn',
    naam: 'Cardiologie Centra Nederland',
    type: 'overig',
    provincie: 'Landelijk',
    producten: [
      { label: 'Hartfalen / onbegrepen dyspnoe',               url: 'https://www.zorgdomein.nl/zd/referral/choose-product/9a78efb0-3197-4d78-836b-b42f64257877' },
      { label: 'Hartfalen / onbegrepen dyspnoe (Almere)',       url: 'https://www.zorgdomein.nl/zd/referral/choose-product/967a00a0-f496-4077-8153-ac8640543c0d' },
      { label: 'Hartfalen / onbegrepen dyspnoe (AMC Amsterdam)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/0ef52b20-001f-4d78-82c0-c8282ba3182d' },
      { label: 'Hartfalen / onbegrepen dyspnoe (Amsterdam Zuid)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/abd1ab79-d04a-431a-8b06-848cb7aa188a' },
      { label: 'Hartfalen / onbegrepen dyspnoe (Amsterdam Geervliet)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/1230505e-764c-4a84-a689-7d841c241502' },
      { label: 'Hartfalen / onbegrepen dyspnoe (Amsterdam Slotervaart)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/aed723f7-addd-4411-8944-6d851061f171' },
    ]
  },

  {
    id: 'hartdokters',
    naam: 'Hartdokters',
    type: 'overig',
    provincie: 'Landelijk',
    producten: [
      { label: 'ECG bij QT verlengende medicatie (interpretatie cardioloog)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/93f23c95-a039-45a0-8718-550d92e2e88c' },
    ]
  },

  {
    id: 'onedayclinic',
    naam: 'OneDayClinic',
    type: 'overig',
    provincie: 'Landelijk',
    producten: [
      { label: 'Diagnostiek SOA bij PrEP (mannelijk geslachtsorgaan)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/f82878e3-ca10-4465-9e61-014473225c54' },
      { label: 'Diagnostiek SOA bij PrEP (vrouwelijk geslachtsorgaan)', url: 'https://www.zorgdomein.nl/zd/referral/choose-product/2808a692-89c5-4820-a1c6-e21dd1d95e64' },
    ]
  },

  {
    id: 'soapoli_online',
    naam: 'Soapoli-online',
    type: 'overig',
    provincie: 'Landelijk',
    producten: [
      { label: 'SOA + PrEP labdiagnostiek',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/8505956d-e403-4ff8-b8a3-afb093aa92d5' },
      { label: 'SOA diagnostiek',                              url: 'https://www.zorgdomein.nl/zd/referral/choose-product/bc5ae1e9-c214-46e5-89ce-8ac75b0389b1' },
    ]
  },

  {
    id: 'rivm',
    naam: 'RIVM',
    type: 'overig',
    provincie: 'Landelijk',
    producten: [
      { label: 'Respiratoire surveillance Nivel Peilstations',  url: 'https://www.zorgdomein.nl/zd/referral/choose-product/4462d854-ad4c-4faf-96da-75c8622b051e' },
    ]
  },

  {
    id: 'dexa_lunteren',
    naam: 'DEXA Lunteren',
    type: 'overig',
    provincie: 'Gelderland',
    producten: [
      { label: 'Botdichtheidsmeting (DEXA)',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/b990e3f3-3049-44cb-8f98-5714c9c34547' },
    ]
  },

  {
    id: 'dexa_colmschate',
    naam: 'DEXA Colmschate',
    type: 'overig',
    provincie: 'Overijssel',
    producten: [
      { label: 'Botdichtheidsmeting (DEXA)',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/be79d327-938b-42c5-965e-571b1426ad25' },
    ]
  },

  {
    id: 'dexa_rijssen',
    naam: 'DEXA Rijssen',
    type: 'overig',
    provincie: 'Overijssel',
    producten: [
      { label: 'Botdichtheidsmeting (DEXA)',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/d9c6c613-aa2d-418f-b5ba-2beee12f1379' },
    ]
  },

  {
    id: 'dexa_almelo',
    naam: 'DEXA Almelo',
    type: 'overig',
    provincie: 'Overijssel',
    producten: [
      { label: 'Botdichtheidsmeting (DEXA)',                    url: 'https://www.zorgdomein.nl/zd/referral/choose-product/df88dc68-fe20-44e1-b0d7-0a81eccc74b0' },
    ]
  },

];
