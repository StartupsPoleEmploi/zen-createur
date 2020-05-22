const { isNull, get } = require('lodash');
const { transaction } = require('objection');

const EmployerDocument = require('../models/EmployerDocument');
const DeclarationInfo = require('../models/DeclarationInfo');
const Declaration = require('../models/Declaration');
const ActivityLog = require('../models/ActivityLog');

const docTypes = DeclarationInfo.types;
const salarySheetType = 'salarySheet';
const employerCertificateType = 'employerCertificate';
const enterpriseMontlyTurnoverType = 'enterpriseMontlyTurnover';
const enterpriseQuaterlyTurnoverType = 'enterpriseQuaterlyTurnover';

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
  const nbMissingFiles = declaration.revenues.reduce((all, current) => {
    if (current.documents.length === 0) {
      all++;
    } else if (current.documents.every(d => d.isTransmitted) === false) {
      all++;
    }

    return all;
  }, 0);

  return nbMissingFiles !== 0
}

const fetchDeclarationAndSaveAsFinishedIfAllDocsAreValidated = ({
  declarationId,
  userId,
}) =>
  Declaration.query()
    .eager('[infos, employers.documents, revenues.documents]')
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
