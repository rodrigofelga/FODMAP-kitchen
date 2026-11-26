/**
 * Evidence sources cited by food records (`Food.sources`, `Serve.src`).
 *
 * `kind` separates primary Monash University publications (laboratory-tested
 * data published by the research group) from clinical references and from
 * secondary dietetic sources that report Monash app data. Dates are the
 * publication dates printed on each page; the Monash app may hold newer values.
 * Full research notes: docs/research/fodmap-evidence-notes.md.
 */
export type SourceKind = 'primary' | 'clinical' | 'secondary' | 'guide';

export interface Source {
  id: string;
  title: string;
  org: string;
  date: string;
  url?: string;
  kind: SourceKind;
}

export const SOURCES = [
  { id: 'GUIDE', title: 'IBS low-FODMAP food guide (5 pages, supplied by the app owner)', org: 'Original guide', date: '—', kind: 'guide' },
  { id: 'M2026', title: 'Treating IBS with a 3-step FODMAP diet (info sheet)', org: 'Monash University', date: '2026', url: 'https://monashfodmap.com/documents/203/3-step_FODMAP_Diet_2026_A4_info_sheet.pdf', kind: 'primary' },
  { id: 'MLIST', title: 'High and low FODMAP foods', org: 'Monash University', date: 'n.d.', url: 'https://www.monashfodmap.com/about-fodmap-and-ibs/high-and-low-fodmap-foods/', kind: 'primary' },
  { id: 'SL25', title: 'Low FODMAP shopping list', org: 'Monash University', date: '3 Feb 2025', url: 'https://www.monashfodmap.com/blog/low-fodmap-shopping-list/', kind: 'primary' },
  { id: 'FIB21', title: 'Getting enough fibre on a low FODMAP diet', org: 'Monash University', date: '14 Jan 2021', url: 'http://www.monashfodmap.com/blog/getting-enough-fibre/', kind: 'primary' },
  { id: 'DA24', title: 'Dairy alternatives: beverage and yoghurt low FODMAP options', org: 'Monash University', date: '20 Feb 2024', url: 'https://monashfodmap.com/blog/dairy-alternatives-beverage-and-yoghurt-low-fodmap-options/', kind: 'primary' },
  { id: 'ALC22', title: 'Going dry for July? How alcohol can impact IBS', org: 'Monash University', date: '23 Jun 2022', url: 'https://monashfodmap.com/blog/going-dry-july-how-alcohol-can-impact-ibs/', kind: 'primary' },
  { id: 'ALC18', title: 'More than FODMAPs: alcohol & IBS', org: 'Monash University', date: '22 Jan 2018', url: 'https://monashfodmap.com/blog/more-fodmaps', kind: 'primary' },
  { id: 'FLAV15', title: 'Adding flavour without adding symptoms', org: 'Monash University', date: '19 Mar 2015 (updated 2026)', url: 'https://monashfodmap.com/blog/adding-flavour-without-adding-symptoms/', kind: 'primary' },
  { id: 'FAQ', title: 'FODMAP FAQs', org: 'Monash University', date: 'n.d.', url: 'https://www.monashfodmap.com/about-fodmap-and-ibs/frequently-asked-questions/', kind: 'primary' },
  { id: 'GR', title: 'Using non-traditional cereals and grains', org: 'Monash University', date: 'n.d.', url: 'https://www.monashfodmap.com/blog/using-non-traditional-cereals-and-grains/', kind: 'primary' },
  { id: 'ST16', title: 'FODMAP stacking: can I overeat green foods?', org: 'Monash University', date: '11 Oct 2016', url: 'https://www.monashfodmap.com/blog/fodmap-stacking-can-i-overeat-green/', kind: 'primary' },
  { id: 'ST19', title: 'How to avoid FODMAP stacking', org: 'Monash University', date: '17 Apr 2019', url: 'http://www.monashfodmap.com/blog/how-avoid-fodmap-stacking/', kind: 'primary' },
  { id: 'ST22', title: 'FODMAP stacking explained', org: 'Monash University', date: '3 Oct 2022', url: 'https://monashfodmap.com/blog/fodmap-stacking-explained/', kind: 'primary' },
  { id: 'PROC', title: 'Food processing and FODMAPs (label ingredients)', org: 'Monash University', date: '7 Feb 2017', url: 'https://www.monashfodmap.com/blog/food-processing-and-fodmaps-what-you/', kind: 'primary' },
  { id: 'LABEL', title: 'Label reading and FODMAPs', org: 'Monash University', date: '3 Sep 2021', url: 'https://www.monashfodmap.com/blog/update-label-reading/', kind: 'primary' },
  { id: 'COVID', title: 'Coping with IBS during COVID-19 — IBS-specific self-care', org: 'Monash University', date: '2020', url: 'http://www.monashfodmap.com/blog/coping-ibs-during-covid-19-part-2-ibs-specific-self-care/', kind: 'primary' },
  { id: 'DIAB', title: 'The low FODMAP diet and diabetes', org: 'Monash University', date: 'n.d.', url: 'https://www.monashfodmap.com/blog/the-low-fodmap-diet-and-diabetes/', kind: 'primary' },
  { id: 'UTD', title: 'UpToDate graphic 90186: FODMAP sources (Shepherd, Lomer & Gibson 2013)', org: 'UpToDate', date: '2013 data', kind: 'clinical' },
  { id: 'ALBY', title: 'Alcohol & the low FODMAP diet (reviewed by a UK registered dietitian; cites Monash app v3.0.8)', org: 'A Little Bit Yummy', date: 'updated 13 Nov 2026', url: 'https://alittlebityummy.com/what-alcohol-is-low-fodmap/', kind: 'secondary' },
  { id: 'KS17', title: 'What’s in your cup? Tea and coffee options for the FODMAPer (cites Monash app)', org: 'Kate Scarlata, RDN', date: '6 Feb 2017', url: 'https://blog.katescarlata.com/2017/02/06/whats-cup-tea-coffee-options-fodmaper/', kind: 'secondary' },
] as const satisfies readonly Source[];

export type SourceId = (typeof SOURCES)[number]['id'];

export const SOURCE_BY_ID: Map<string, Source> = new Map(SOURCES.map((s) => [s.id, s as Source]));
