export type IcdSystem = 'ICD10' | 'ICD11';

export interface IcdSearchResult {
  code: string;
  description: string;
  system: IcdSystem;
}
