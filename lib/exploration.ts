export const cameraIds = ['rothorn', 'blauherd', 'sunnegga'] as const;
export type CameraId = typeof cameraIds[number];
export type ExplorePlan = {place: CameraId; reason: string; sunlightMinutes: number | null; showClimateContext?: boolean};
export type Region = {image: 'A' | 'B'; x: number; y: number; width: number; height: number};
export type Observation = {title: string; detail: string; regions: Region[]};
export type ExploreAnswer = {headline: string; summary: string; overlappingViews: boolean; observations: Observation[]; unknowns: string[]};
export type EvidenceFrame = {id: 'A' | 'B'; image: string; source: string; capturedAt: string; width: number; height: number};
export type ExploreEvent =
 | {type: 'plan'; plan: ExplorePlan}
 | {type: 'frames'; frames: EvidenceFrame[]; fetchedAt: string}
 | {type: 'answer'; answer: ExploreAnswer; model: string; generatedAt: string}
 | {type: 'error'; error: string};

const object = (properties: Record<string, unknown>) => ({type: 'object', properties, required: Object.keys(properties), additionalProperties: false});
export const planSchema = object({
 place: {type: 'string', enum: cameraIds},
 reason: {type: 'string', description: 'A short sentence describing where you will take the visitor. Do not claim to have seen images yet.'},
 sunlightMinutes: {type: ['integer', 'null'], description: 'Only when the visitor explicitly requests a sunlight simulation, minutes after midnight Zurich, 360 to 1200. Otherwise null.'},
 showClimateContext: {type: 'boolean', description: 'Open the sourced Winter over time panel for questions about climate, environmental impact, glacier change over years, the future of winter, sustainability, or Protect Our Winters. False for ordinary same-day camera comparisons.'},
});
export const answerSchema = object({
 headline: {type: 'string', description: 'At most 10 words; the most useful supported observation.'},
 summary: {type: 'string', description: 'One sentence answering the visitor, at most 35 words.'},
 overlappingViews: {type: 'boolean'},
 observations: {type: 'array', minItems: 1, maxItems: 3, items: object({
  title: {type: 'string', description: 'At most 7 words.'},
  detail: {type: 'string', description: 'At most 40 words; distinguish earlier A and later B, referencing concrete visible evidence.'},
  regions: {type: 'array', minItems: 1, maxItems: 2, items: object({
   image: {type: 'string', enum: ['A', 'B']},
   x: {type: 'number'}, y: {type: 'number'}, width: {type: 'number'}, height: {type: 'number'},
  })},
 })},
 unknowns: {type: 'array', minItems: 1, maxItems: 2, items: {type: 'string', description: 'One concise, relevant limitation, at most 25 words.'}},
});

export function validatePlan(value: unknown): ExplorePlan {
 const p = value as ExplorePlan;
 if (!p || !cameraIds.includes(p.place) || typeof p.reason !== 'string' || p.reason.length > 400 || !(p.sunlightMinutes === null || (Number.isInteger(p.sunlightMinutes) && p.sunlightMinutes >= 360 && p.sunlightMinutes <= 1200))) throw new Error('Astra could not choose a supported view. Please try again.');
 if (p.showClimateContext !== undefined && typeof p.showClimateContext !== 'boolean') throw new Error('Astra could not choose a supported context. Please try again.');
 // Older recorded explorations predate the climate panel.
 return {place: p.place, reason: p.reason, sunlightMinutes: p.sunlightMinutes, showClimateContext: p.showClimateContext ?? false};
}
export function validateAnswer(value: unknown): ExploreAnswer {
 const a = value as ExploreAnswer;
 const short = (v: unknown, limit: number) => typeof v === 'string' && v.length > 0 && v.length <= limit;
 if (!a || !short(a.headline, 160) || !short(a.summary, 500) || typeof a.overlappingViews !== 'boolean' || !Array.isArray(a.observations) || a.observations.length < 1 || a.observations.length > 3 || !Array.isArray(a.unknowns) || a.unknowns.length < 1 || a.unknowns.length > 2 || !a.unknowns.every(s => short(s, 350))) throw new Error('Astra returned an incomplete evidence summary. Please try again.');
 for (const o of a.observations) {
  if (!short(o.title, 160) || !short(o.detail, 600) || !Array.isArray(o.regions) || o.regions.length < 1 || o.regions.length > 2) throw new Error('Astra returned an incomplete observation.');
  const seen = new Set<string>();
  for (const r of o.regions) {
   if (!['A', 'B'].includes(r.image) || seen.has(r.image) || ![r.x, r.y, r.width, r.height].every(Number.isFinite) || r.x < 0 || r.y < 0 || r.width < .015 || r.height < .015 || r.x + r.width > 1.001 || r.y + r.height > 1.001) throw new Error('Astra could not locate its evidence within the images. Please try again.');
   seen.add(r.image);
  }
 }
 return a;
}
export function captureLabel(iso: string) {
 return new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Zurich', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}).format(new Date(iso));
}
