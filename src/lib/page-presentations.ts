// Ownership registry for the 32 WordPress pages being redesigned. News and the home
// keep their existing templates; adding a new page does not silently assign a design.
export const PAGE_PRESENTATIONS = {
  informative: [
    'que-es-lem', 'glossari-em', 'deteriorament-cognitiu-en-la-em',
    'afectacio-cognitiva-i-esclerosi-multiple', 'pla-integral-de-benestar-emocional-2',
    'decaleg-exercici-fisic-em', 'conveni-sobre-els-drets-de-les-persones-amb-discapacitat-cdpd',
  ],
  association: [
    'acerca-de', 'junta-associacio-tranaem', 'historia', 'estatuts',
    'pla-estrategic-2020-2024', 'memories-assemblea-general',
    'avis-legal-i-politica-de-privacitat', 'contactans', 'borrador-automatico-2',
    'alta-soci', 'alta-al-butlleti-de-noticies',
  ],
  community: [
    'actualidats', 'activitats-2', 'dia-internacional-2021', 'borrador-automatico',
    'envia-un-sms-al-601', 'opinio', 'nor-raguig', 'jacint-risco',
    'el-nen-del-sola-dandorra', 'sonia-araujo', 'youtube', 'imatges',
    'trana-home', 'slide-portada',
  ],
} as const;

export type PagePresentation = keyof typeof PAGE_PRESENTATIONS;

export function pagePresentation(slug: string): PagePresentation | undefined {
  return (Object.entries(PAGE_PRESENTATIONS) as [PagePresentation, readonly string[]][])
    .find(([, slugs]) => slugs.includes(slug))?.[0];
}
