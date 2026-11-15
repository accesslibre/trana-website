// Sample content for the design previews under /disseny/.
// Texts come from the public TRANA WordPress pages and posts (15 November 2026).
// Codex replaces these objects with adapter data; the component props stay the same.

export const contact = {
  phone: '+376 821 345',
  phoneHref: 'tel:+376821345',
  email: 'info@tranandorra.org',
  address: ['Carrer Prada Casadet, locals C-D', 'AD500 Andorra la Vella'],
  mapHref: 'https://www.openstreetmap.org/search?query=Prada%20Casadet%2C%20Andorra%20la%20Vella',
};

export interface StoryRef { title: string; href?: string; current?: boolean }
export interface Voice {
  name: string; initials: string; note?: string; colour: string; series?: string; page: string;
  stories: StoryRef[];
}

export const voices: Voice[] = [
  {
    name: 'El nen del Solà d’Andorra', initials: 'NS', page: 'https://www.tranandorra.org/el-nen-del-sola-dandorra/', note: 'Afectat d’EM, 25 anys', colour: 'orange',
    stories: [
      { title: 'La batalla invisible de l’esclerosi múltiple' },
      { title: 'Un dia per commemorar la diversitat. Dia Mundial de la Síndrome de Down' },
      { title: 'La discriminació al bany, una experiència frustrant' },
      { title: 'Dia Mundial de l’Autisme. Commemorant la diversitat neurodivergent' },
      { title: 'Dia Mundial del Parkinson: sense embuts i sense filtres' },
      { title: 'Fibromiàlgia i fatiga crònica: no estàs sol/a' },
      { title: 'El meu darrer brot… entre la discriminació i la incertesa', href: '/disseny/vivencies/el-meu-darrer-brot/', current: true },
      { title: 'Una dansa entre dos móns (part 1/2)' },
      { title: 'Una dansa entre dos móns (part 2/2)' },
      { title: 'Un adeu sense retorn' },
    ],
  },
  {
    name: 'Sònia Araujo', initials: 'SA', page: 'https://www.tranandorra.org/sonia-araujo/', colour: 'blue', series: 'La meva vida amb EM',
    stories: [
      { title: 'La meva vida amb EM. Capítol I' },
      { title: 'La meva vida amb EM. Capítol II' },
      { title: 'La meva vida amb EM. Capítol III' },
      { title: 'La meva vida amb EM. Capítol IV' },
      { title: 'La meva vida amb EM. Capítol V (final)' },
    ],
  },
  {
    name: 'Nor Raguig', initials: 'NR', page: 'https://www.tranandorra.org/nor-raguig/', note: 'Afectat d’EM, 28 anys', colour: 'green',
    stories: [
      { title: 'La vida del Nor' },
      { title: 'Desordre afectiu en l’esclerosi múltiple: comprendre els desafiaments emocionals' },
      { title: 'L’esclerosi múltiple: desafiaments i esperances' },
      { title: 'Maria Pombo: brillant amb valor i resiliència' },
      { title: 'Els criteris de McDonald en esclerosi múltiple' },
      { title: 'Paràlisi en l’esclerosi múltiple' },
      { title: 'L’impacte de l’estrès emocional en l’esclerosi múltiple' },
      { title: 'Per què l’EM no té cura' },
      { title: 'Desxifrant els símptomes de l’esclerosi múltiple' },
    ],
  },
  {
    name: 'Jacint Risco', initials: 'JR', page: 'https://www.tranandorra.org/jacint-risco/', colour: 'red',
    stories: [
      { title: 'La parestèsia en l’EM' },
      { title: 'Deteriorament cognitiu en l’EM' },
    ],
  },
];

export const story = {
  title: 'El meu darrer brot… entre la discriminació i la incertesa',
  date: '2024-05-30',
  dateLabel: '30 de maig de 2024',
  minutes: 4,
  author: voices[0],
  position: 7,
  source: 'https://www.tranandorra.org/2024/05/el-meu-darrer-brot-entre-la-discriminacio-i-la-incertesa-30-5-dia-internacional-em/',
  lede: 'El 30 de maig, al Dia Mundial de l’Esclerosi Múltiple, cada cinc minuts algú en algun lloc del món és diagnosticat amb EM, avui vull compartir la meva història. No és una història d’heroïsme, sinó una realitat crua que molts amb EM enfrontem: la discriminació i les seves repercussions en la nostra salut.',
  before: [
    'El meu darrer brot va arribar sense avisar, com sempre. Un dia em vaig aixecar amb la cama dreta entumida, la sensació de formigueig recorrent el meu cos com si mil agulles em piquessin. La fatiga em va colpejar com una onada, ofegant la meva energia i deixant-me sense forces per a les tasques més simples, fins i tot per menjar. Però va seguir donant-me ben dur, l’endemà vaig començar a perdre la vista, però sort que només era per un ull. Vaig trucar a urgències i els vaig explicar el que em passava… em van dir de venir urgentment a l’hospital. Mes bé em van dir de no moure’m, que enviarien l’ambulància a buscar-me. La doctora es va posar al telèfon i em va dir que em calmarà, que estigues tranquil, cosa que fàcil no es, i que vindrà l’ambulància.',
    'Vaig estar a urgències. Aquí la història no és gens entretinguda, però perquè us ho pugueu imaginar és com quan vas a l’escola de petit i et poses a plorar i plorar, perquè no hi vols anar. La sensació és la mateixa, però amb la maduresa de l’edat adulta. Llàgrimes contingudes, una barreja de por i impotència. Era un mal dia i temporada per fer un brot. Estava en una etapa de la meva vida on tot anava bastant bé, em van ascendir a la feina, però pel meu estat de salut, no va poder ser. A vegades hi segueixo pensant, és una pena, l’emoció que vaig sentir per aquest ascens que mai no vaig poder gaudir. Però vaja, la vida segueix al capdavall.',
    'I en les pròximes setmanes, un dia tenia planejat una trobada amb amics en un bar. Tots amb mobilitat molt reduïda, dos en cadira de rodes. Quedem en un espai per escapar-se de la rutina i compartir rialles. Tot i això, la discriminació ens va agredir des del moment en què vam entrar al bar.',
    'L’estrès d’aquesta situació va empitjorar el meu brot. El meu cos, ja debilitat per l’EM, no va poder suportar la càrrega emocional, els símptomes es van intensificar els dies posteriors. Vaig saber que era per l’estrès d’aquesta situació. En arribar a casa, em vaig ensorrar al sofà, la frustració, la impotència i la ràbia em consumien. No només abreviava amb els efectes físics de l’EM, sinó també amb les conseqüències emocionals de la discriminació.',
    'Després de quatre mesos, vaig veure que això no millorava, les seqüeles eren dures de portar. Semblava que aquest cop no recuperaré la mobilitat com ho feia en el passat. Vaig parlar amb la meva doctora, i em va confirmar el que temia: la malaltia havia avançat molt, i que era molt probable que no recuperés la mobilitat.',
    'Avui dia encara intento recuperar, almenys la vista penso. Si només vaig coix, pot ser que encara ho sobrepassi.',
  ],
  quote: 'L’EM és com un camp de mines. Mai no saps quan o on explotarà el pròxim brot.',
  after: [
    'Aquesta és la crua realitat d’aquesta malaltia, t’ataca quan més no t’ho esperes. L’EM és com un camp de mines. Mai no saps quan o on explotarà el pròxim brot. La incertesa i la por són companys constants, ennuvolant-nos els nostres dies i robant-nos la tranquil·litat.',
    'Aquell dia al bar m’ho va confirmar. L’estrès i les emocions negatives poden desencadenar o empitjorar una malaltia. En aquest cas amb l’EM, és implacable.',
    'No només lluitem contra una malaltia física, sinó també contra una societat on molt sovint ens ignora, ens discrimina i ens fa invisibles. La meva història és només una entre milers.',
    'El Dia Mundial de l’Esclerosi Múltiple, és un dia de solidaritat mundial, acció col·lectiva i esperança. Un dia que se celebra cada any el 30 de maig per compartir històries, conscienciar i fer campanyes amb i per a tots els afectats per l’EM.',
    'Darrere de cada persona amb EM hi ha una història, una lluita constant i una esperança indestructible.',
    'Hem de crear una societat on tots puguem conviure, on la discriminació no tingui cabuda i on tots puguem viure les nostres vides amb dignitat i respecte.',
  ],
};

export interface DocItem {
  title: string; detail?: string; href?: string; kind: 'PDF' | 'Web'; size?: string; year?: string; missing?: boolean;
}

const up = 'https://www.tranandorra.org/wp-content/uploads/';
export const reports: DocItem[] = [
  { title: 'Memòria 2024', year: '2024', kind: 'PDF', size: '577 kB', href: `${up}2025/03/MEMORIA-2025-TRANA.pdf` },
  { title: 'Memòria 2023', year: '2023', kind: 'PDF', size: '379 kB', href: `${up}2024/03/MEMORIA-2023-TRANA.pdf` },
  { title: 'Memòria 2022', year: '2022', kind: 'PDF', size: '523 kB', href: `${up}2023/11/MEMORIA-2022-TRANA.pdf` },
  { title: 'Memòria 2021', year: '2021', kind: 'PDF', missing: true },
  { title: 'Memòria 2020', year: '2020', kind: 'PDF', size: '374 kB', href: `${up}2021/05/MEMO%CC%80RIA-2020-TRANA.pdf` },
];

export const docGroups: { id: string; title: string; intro: string; items: DocItem[] }[] = [
  {
    id: 'associacio', title: 'Com funciona l’associació', intro: 'Les normes i els plans que guien TRANA.',
    items: [
      { title: 'Estatuts de TRANA', detail: 'Objecte social, socis, assemblea i junta directiva', kind: 'PDF', size: '6,7 MB', href: `${up}2021/05/Estatuts-TRANA.pdf` },
      { title: 'Pla estratègic 2020–2024', detail: 'Versió del 20 de novembre de 2020', kind: 'PDF', size: '881 kB', href: `${up}2021/05/2020.11.20-TRANA-PE-Esborrany-1.pdf` },
    ],
  },
  {
    id: 'drets', title: 'Drets i recursos', intro: 'Textos de referència per conèixer i reclamar els teus drets.',
    items: [
      { title: 'Convenció de l’ONU sobre els drets de les persones amb discapacitat', detail: 'Resum i enllaços a la CDPD', kind: 'Web', href: 'https://www.tranandorra.org/conveni-sobre-els-drets-de-les-persones-amb-discapacitat-cdpd/' },
      { title: 'Guia de recursos per a les persones amb discapacitat', detail: 'Publicada pel Govern d’Andorra · Notícia del 28 de setembre de 2026', kind: 'Web', href: '/noticies/' },
    ],
  },
];

export const board = [
  { role: 'Presidenta', name: 'Emma Ridgway Rowinsky' },
  { role: 'Vicepresidenta', name: 'Regina Pastor Meneses' },
  { role: 'Secretària', name: 'Sonia Araujo de Sa' },
  { role: 'Tresorer', name: 'Hassan Raguig' },
  { role: 'Vocal', name: 'Ivan Amador Bagué' },
  { role: 'Vocal', name: 'Cristina Bagué Allue' },
];

export const milestones = [
  { year: '1993', title: 'Neix T.R.A.N.A.', text: 'Una seixantena de persones promouen l’associació pel Tractament i Recuperació de les Afeccions Neuromotrius a Andorra. El Govern n’aprova els estatuts el 21 d’abril.' },
  { year: '1994', title: 'La primera junta', text: 'El 9 de març es constitueix la primera junta directiva, presidida per Josep Mª Beal Benedico.' },
  { year: '1998', title: 'L’esclerosi múltiple, als estatuts', text: 'L’assemblea extraordinària inclou explícitament les persones afectades d’esclerosi múltiple.' },
  { year: '2000', title: 'A l’aigua', text: 'Comencen les sessions de piscina, amb l’Escola Especialitzada Nostra Senyora de Meritxell.' },
  { year: '2002', title: 'Drets a la llei', text: 'TRANA col·labora amb el Govern en el projecte de llei de garantia dels drets de les persones amb discapacitat.' },
  { year: '2008', title: 'Neix la FAAD', text: 'Després de tres anys de converses amb altres entitats, es formalitza la Federació Andorrana d’Associacions de Persones amb Discapacitat.' },
  { year: '2011', title: 'Tallers neurocognitius', text: 'Amb Creand Fundació, comencen els tallers setmanals d’estimulació neurocognitiva.' },
  { year: '2014', title: 'Ioga i piscina', text: 'La piscina es trasllada a Escaldes-Engordany amb la Creu Roja i al desembre arrenquen els tallers de ioga.' },
  { year: '2020', title: 'A distància', text: 'La COVID-19 atura les activitats presencials i els tallers passen a fer-se de manera virtual.' },
  { year: '2023', title: '30 anys', text: 'L’associació celebra tres dècades acompanyant persones amb esclerosi múltiple.' },
  { year: '2025', title: 'Nova junta', text: 'El 20 de febrer, l’assemblea elegeix la junta directiva per als propers quatre anys.' },
  { year: '2026', title: 'EM-LINE', text: 'Campanya per implantar els tallers neurocognitius en línia.' },
];
