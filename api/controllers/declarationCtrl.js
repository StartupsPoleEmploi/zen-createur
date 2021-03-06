const { isNull, get } = require('lodash');
const { transaction } = require('objection');
const moment = require('moment');

const EmployerDocument = require('../models/EmployerDocument');
const DeclarationInfo = require('../models/DeclarationInfo');
const Declaration = require('../models/Declaration');
const ActivityLog = require('../models/ActivityLog');

const docTypes = DeclarationInfo.types;
const salarySheetType = 'salarySheet';
const employerCertificateType = 'employerCertificate';

const DOCUMENT_LABELS = {
  sickLeave: 'Feuille maladie',
  internship: 'Attestation de stage',
  maternityLeave: 'Attestation de congé maternité',
  retirement: 'Attestation retraite',
  invalidity: 'Attestation invalidité',
  employerCertificate: 'Attestation employeur',
  salarySheet: 'Bulletin de salaire',
  salarySheetSarl: 'Bulletin de salaire',
  enterpriseMontlyTurnover: 'Déclaration CA mensuelle',
  enterpriseQuaterlyTurnover: 'Déclaration CA trimestrielle',
  VPGeneralOrDecision: 'Procès-verbal d\'assemblée générale ou Relevé de décision',
  selfEmployedSocialDeclaration: 'Déclaration Sociale des indépendants',
  declarationOfProfessionalIncome: 'Déclaration des revenus professionnels',
  artistIncomeStatement: 'Déclaration des revenus des artistes (MDA / Agessa)',
};

const CREATORTAXRATE = {
  MONTHLY: 'monthly',
  QUATERLY: 'quaterly',
  YEARLY: 'yearly',
};

const getNbEnterprisesNeedFiles = (declaration, lastDeclaration = null) => {
  const dateMonth = moment(declaration.declarationMonth.month).format("M");
  const nbMissingFiles = 0;

  declaration.revenues.filter(r => r.documents.length === 0 || r.documents.every(d => d.isTransmitted === false))
    .map(enterprise => {
    switch (enterprise.status) {
      case 'sarl':
        if(dateMonth === 1 || lastDeclaration == null) {
          if(enterprise.documents.length > 0 && enterprise.documents.some(d => d.type === DOCUMENT_TYPES.salarySheetSarl)) {
            nbMissingFiles ++;
          } else if(enterprise.documents.length > 0 && enterprise.documents.some(d => d.type === DOCUMENT_TYPES.VPGeneralOrDecision)) {
            nbMissingFiles ++;
          } else {
            nbMissingFiles ++;
            nbMissingFiles ++;
          }
        } else if(lastDeclaration !== null && lastDeclaration.revenues.length > 0 && lastDeclaration.revenues[0].type === DOCUMENT_TYPES.salarySheet) {
          nbMissingFiles ++;
        }
      break;
      case 'entrepriseIndividuelle':
        if (dateMonth === 4) {
          nbMissingFiles ++;
        }
        break;
      case 'autoEntreprise':
        const date = moment(declaration.declarationMonth.month);
  
        if (declaration.taxeDue === CREATORTAXRATE.MONTHLY) {
          nbMissingFiles ++;
        }
  
        if (declaration.taxeDue === CREATORTAXRATE.QUATERLY && dateMonth % 3 === 0) {
          nbMissingFiles ++;
        }
        break;
      case 'nonSalarieAgricole':
        if (dateMonth === 1) {
          nbMissingFiles ++;
        }
        break;
      case 'artisteAuteur':
        nbMissingFiles ++;
        break;
    }
  })

  return nbMissingFiles;
}

const hasMissingEmployersDocuments = (declaration) =>
  declaration.employers.reduce((prev, employer) => {
    if (!employer.hasEndedThisMonth) {
      return prev + (get(employer, 'documents[0].isTransmitted') ? 0 : 1);
    }

    /*
        The salary sheet is optional for users which have already sent their employer certificate,
        in which case we do not count it in the needed documents.
      */
    const hasEmployerCertificate = employer.documents.some(
      ({ type, isTransmitted }) => type === employerCertificateType && isTransmitted,
    );
    const hasSalarySheet = employer.documents.some(
      ({ type, isTransmitted }) => type === salarySheetType && isTransmitted,
    );

    if (hasEmployerCertificate) return prev + 0;
    return prev + (hasSalarySheet ? 1 : 2);
  }, 0) !== 0

const hasMissingDeclarationDocuments = (declaration) =>
  declaration.infos.filter(
    ({ type, isTransmitted }) => type !== 'jobSearch' && !isTransmitted,
  ).length !== 0

const hasMissingRevenuesDocuments = (declaration, lastDeclaration) => {
  return getNbEnterprisesNeedFiles(declaration, lastDeclaration) !== 0
}

const fetchDeclarationAndSaveAsFinishedIfAllDocsAreValidated = ({
  declarationId,
  userId,
}) =>
  Declaration.query()
    .eager('[infos, employers.documents, revenues.documents, declarationMonth]')
    .where(userId, '=', userId)
    .orderBy('monthId', 'desc')
    .limit(2)
    .then(declarations => {
      const [declaration, lastDeclaration] = declarations;

      if (
        declaration === null 
        || hasMissingEmployersDocuments(declaration)
        || hasMissingDeclarationDocuments(declaration)
        || hasMissingRevenuesDocuments(declaration, lastDeclaration)
      ) {
        return declaration;
      }

      declaration.isFinished = true;

      return transaction(Declaration.knex(), (trx) =>
        Promise.all([
          declaration.$query(trx).upsertGraph(),
          ActivityLog.query(trx).insert({
            userId,
            action: ActivityLog.actions.VALIDATE_FILES,
            metadata: JSON.stringify({
              declarationId,
            }),
          }),
        ]).then(() =>
          // Note : we don't use upsertGraphAndFetch above because we want the declarationMonth with the declaration
          // And add it in the initial query will cause some trouble with the date :
          //   See => https://github.com/StartupsPoleEmploi/zen/commit/d10e639179881ca67c63968054ab44f848b0d824
          Declaration.query()
            .eager('[infos, employers.documents, revenues.documents, declarationMonth]')
            .findOne({
              id: declarationId,
              userId,
            })));
    });

module.exports = {
  fetchDeclarationAndSaveAsFinishedIfAllDocsAreValidated,
};
