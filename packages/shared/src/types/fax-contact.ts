export type FaxContact = {
  id: string;
  name: string;
  faxNumber: string;
  company?: string;
};

export type FaxContactCreate = {
  name: string;
  faxNumber: string;
  company?: string;
};
