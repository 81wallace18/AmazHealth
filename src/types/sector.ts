export interface Sector {
  id: string;
  name: string;
  type: string;
  code: string;
  category: 'AREA' | 'SERVICE';
  active: boolean;
}
