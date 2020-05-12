/* Colors */
// TODO harmonize error colors here
export const primaryBlue = '#0065DB';
export const secondaryBlue = '#262C65';
export const helpColor = '#0065DB';
export const darkBlue = '#1e2c59';

/* Sizes */
export const mobileBreakpoint = '672px';
export const intermediaryBreakpoint = '960px';

/* Material UI breakpoints in width order. */
// TODO: all composants using this should be changed to use hooks and useMediaQuery() instead
export const muiBreakpoints = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
};

export const ActuTypes = {
  INTERNSHIP: 'internship',
  SICK_LEAVE: 'sickLeave',
  MATERNITY_LEAVE: 'maternityLeave',
  RETIREMENT: 'retirement',
  INVALIDITY: 'invalidity',
  JOB_SEARCH: 'jobSearch',
};

export const DOCUMENT_LABELS = {
  sickLeave: 'Feuille maladie',
  internship: 'Attestation de stage',
  maternityLeave: 'Attestation de congé maternité',
  retirement: 'Attestation retraite',
  invalidity: 'Attestation invalidité',
  employerCertificate: 'Attestation employeur',
  salarySheet: 'Bulletin de salaire',
};

export const jobSearchEndMotive = {
  WORK: 'work',
  RETIREMENT: 'retirement',
  OTHER: 'other',
};

export const MAX_PDF_PAGE = 5;

export const CREATORTAXRATE = {
  MONTHLY: 'monthly',
  QUATERLY: 'quaterly',
  YEARLY: 'yearly',
};

export const MAXHOURCANWORK = 151;

export const TIMEWORKED = {
  NO: 'no',
  ALF: 'alf',
  FULL: 'full',
};

export const DEFAULT_ERROR_MESSAGE = `Nous sommes désolés, mais une erreur s'est produite. Merci de réessayer ultérieurement.
Si le problème persiste, merci de contacter l'équipe Zen, et d'effectuer
en attendant votre actualisation sur Pole-emploi.fr.`;