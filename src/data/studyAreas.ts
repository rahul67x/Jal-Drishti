export interface StudyArea {
  id: string;
  name: string;
  state: string;
  center: [number, number];
  zoom: number;
  area: string;
}

export const studyAreas: StudyArea[] = [
  {
    id: 'saswad',
    name: 'Saswad, Pune',
    state: 'Maharashtra',
    center: [18.345, 74.035],
    zoom: 13,
    area: '142.6 km²',
  },
];

export const defaultStudyArea = studyAreas[0];
