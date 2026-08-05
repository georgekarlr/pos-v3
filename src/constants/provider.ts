export interface SoftwareProviderInfo {
  name: string;
  address: string;
  tin: string;
  accreditationNo: string;
  dateIssued: string; // format YYYY-MM-DD
  validUntil: string; // format YYYY-MM-DD
}

export const SOFTWARE_PROVIDER_INFO: SoftwareProviderInfo = {
  name: 'Ceintelly Software Development Services',
  address: 'Purok Bougainvilla 1, San Pedro, Pagadian City, 7016 Zamboanga del Sur',
  tin: '809-287-001-0000',
  accreditationNo: 'ACCRED-CEINTELLY-2026-001',
  dateIssued: '2024-01-01',
  validUntil: '2029-01-01',
};
