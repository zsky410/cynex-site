export type IntegrityWarning = {
  code: string;
  message: string;
  field?: string;
  relatedResource?: string;
  relatedId?: string;
};

export type BlockingDependency = {
  resource: string;
  count: number;
  sampleIds: string[];
};

export type DeletePreflightResult = {
  canDelete: boolean;
  blockingDependencies: BlockingDependency[];
};
