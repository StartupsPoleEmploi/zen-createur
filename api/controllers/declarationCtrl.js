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
const enterpriseMontlyTurnoverType = 'enterpriseMontlyTurnover';
const enterpriseQuaterlyTurnoverType = 'enterpriseQuaterlyTurnover';

const CREATORTAXRATE = {
  MONTHLY: 'monthly',
  QUATERLY: 'quaterly',
  YEARLY: 'yearly',
};

const getNbEnterprisesNeedFiles = (declaration) => {
  const dateMonth = moment(declaration.declarationMonth.month).format("M");

  switch (declaration.status) {
    case 'sarl':
      return 1;
      break;
    case 'entrepriseIndividuelle':
      if (dateMonth === 4) {
        return 1;
      }
      break;
    case 'autoEntreprise':
      const date = moment(declaration.declarationMonth.month);

      if (declaration.taxeDue === CREATORTAXRATE.MONTHLY) {
        return 1;
      }

      if (declaration.taxeDue === CREATORTAXRATE.QUATERLY && dateMonth % 3 === 0) {
        return 1;
      }
      break;
    case 'nonSalarieAgricole':
      if (dateMonth === 1) {
        return 1;
      }
      break;
    case 'artisteAuteur':
      return 1;
      break;
  }

  return 0;
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

const hasMissingRevenuesDocuments = (declaration) => {
  const nbMissingFiles = getNbEnterprisesNeedFiles(declaration) - declaration.revenues.reduce((all, current) => {
    if(current.documents.every(({isTransmitted}) => isTransmitted)) {
      return all + current.documents.length;
    } else {
      return all;
    }
  }, 0);

  return nbMissingFiles !== 0
}

const fetchDeclarationAndSaveAsFinishedIfAllDocsAreValidated = ({
  declarationId,
  userId,
}) =>
  Declaration.query()
    .eager('[infos, employers.documents, revenues.documents, declarationMonth]')
    .findOne({
      id: declarationId,
      userId,
    })
    .then((declaration) => {
      if (
        hasMissingEmployersDocuments(declaration)
        || hasMissingDeclarationDocuments(declaration)
        || hasMissingRevenuesDocuments(declaration)
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
