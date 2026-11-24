import type { ApplicantDraft } from "./applicant-draft";

export type ApplicantFormProps = {
  values: ApplicantDraft;
  errors: Record<string, string>;
  canContinue: boolean;
  onChange: (patch: Partial<ApplicantDraft>) => void;
};
