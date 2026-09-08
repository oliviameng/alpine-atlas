// Curated primary sources, reviewed 8 September 2026. Reported periods stay
// explicit: these figures must never be presented as measurements from webcams.
export const winterContext = {
 glacier: {
  name: 'Zmuttgletscher', startYear: 1859, endYear: 2016,
  startArea: 21.24, endArea: 15.74, lossPercent: 26,
  url: 'https://tc.copernicus.org/articles/13/1889/2019/#section4',
  title: 'Mölg et al. · The Cryosphere, 2019, §4.2',
 },
 report: {
  url: 'https://doi.glamos.ch/pubs/annualrep/annualrep_2025.pdf#page=10',
  title: 'GLAMOS · 2025 report, p. 10',
  published: '26 September 2025',
  startYear: 2015,
  endYear: 2025,
  lossPercent: 24,
 },
 pow: {
  workUrl: 'https://www.protectourwinters.ch/de/unsere-arbeit/',
  actionUrl: 'https://www.protectourwinters.ch/de/handeln/',
 },
};

export const winterContextInstructions = `The application includes a separate, sourced "Winter over time" panel. It reports a 24% reduction in total Swiss glacier ice volume during 2015–2025, from GLAMOS's annual report published 26 September 2025, page 10. This is a Swiss-wide estimate based on monitoring and extrapolation, NOT a measurement of Zermatt piste snow or a change established by the supplied images. It also links Protect Our Winters Switzerland's work and action resources: outdoor community climate advocacy, responsible travel, caring for gear, and getting involved. These are curated references, not a live climate-data query, and Alpine Atlas is not affiliated with POW.
Never attribute a difference between these two camera images to climate change or infer glacier retreat, long-term snowfall trends, carbon emissions, or snow depth from them. Even images from different seasons or years alone cannot establish climate attribution. For climate/POW questions, acknowledge what this pair cannot establish and direct the visitor to "Winter over time" for the sourced wider context. Keep the headline and observations grounded in the images; do not insert climate statistics or advocacy into visual observation regions. Do not invent other climate statistics, forecasts, sources, or claims about POW.`;
