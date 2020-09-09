import { get } from 'lodash';
import { readAndCompressImage } from 'browser-image-resizer';
import { CREATORTAXRATE, DOCUMENT_LABELS, DOCUMENT_TYPES } from '../constants';
import moment from 'moment';

const extractFileExtension = (file) => {
  const dotIndex = file.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return file.substring(dotIndex, file.length).toLowerCase();
};

export const canUsePDFViewer = (fileName) => {
  if (!fileName) return false;
  const extension = extractFileExtension(fileName);
  return ['.png', '.pdf', '.jpg', '.jpeg'].includes(extension);
};

export const getMissingEnterprisesFiles = (declaration, lastDeclaration = null) => {
  const dateMonth = moment(declaration.declarationMonth.month).format("M");
  const fileList = [];

  declaration.revenues.map(enterprise => {
    switch (enterprise.status) {
      case 'sarl':
        if(dateMonth === 1 || lastDeclaration == null) {
          if(enterprise.documents.length > 0 && enterprise.documents.some(d => d.type === DOCUMENT_TYPES.salarySheetSarl)) {
            fileList.push({ name: DOCUMENT_LABELS.salarySheetSarl, type: DOCUMENT_TYPES.salarySheetSarl, declarationRevenueId: enterprise.id, documents: enterprise.documents });
          } else if(enterprise.documents.length > 0 && enterprise.documents.some(d => d.type === DOCUMENT_TYPES.VPGeneralOrDecision)) {
            fileList.push({ name: DOCUMENT_LABELS.VPGeneralOrDecision, type: DOCUMENT_TYPES.VPGeneralOrDecision, declarationRevenueId: enterprise.id, documents: enterprise.documents });            
          } else {
            fileList.push({ name: DOCUMENT_LABELS.salarySheetSarl, type: DOCUMENT_TYPES.salarySheetSarl, declarationRevenueId: enterprise.id, documents: enterprise.documents });
            fileList.push({ name: DOCUMENT_LABELS.VPGeneralOrDecision, type: DOCUMENT_TYPES.VPGeneralOrDecision, declarationRevenueId: enterprise.id, documents: enterprise.documents });
          }
        } else if(lastDeclaration !== null && lastDeclaration.revenues.length > 0) {
          const getSarl = lastDeclaration.revenues.find(r => r.type === 'sarl')
          if(getSarl && getSarl.documents.some(d => d.type === DOCUMENT_TYPES.salarySheetSarl)) {
            fileList.push({ name: DOCUMENT_LABELS.salarySheetSarl, type: DOCUMENT_TYPES.salarySheetSarl, declarationRevenueId: enterprise.id, documents: enterprise.documents });
          } else {
            fileList.push({ name: DOCUMENT_LABELS.salarySheetSarl, type: DOCUMENT_TYPES.salarySheetSarl, declarationRevenueId: enterprise.id, documents: enterprise.documents });
            fileList.push({ name: DOCUMENT_LABELS.VPGeneralOrDecision, type: DOCUMENT_TYPES.VPGeneralOrDecision, declarationRevenueId: enterprise.id, documents: enterprise.documents });
          }
        }
      break;
      case 'entrepriseIndividuelle':
        if (dateMonth === 4) {
          fileList.push({ name: DOCUMENT_LABELS.selfEmployedSocialDeclaration, type: DOCUMENT_TYPES.selfEmployedSocialDeclaration, declarationRevenueId: enterprise.id, documents: enterprise.documents });
        }
        break;
      case 'autoEntreprise':
        const date = moment(declaration.declarationMonth.month);
  
        if (declaration.taxeDue === CREATORTAXRATE.MONTHLY) {
          fileList.push({
            name: `Déclaration CA ${date.format('MM-YYYY')}`, type: DOCUMENT_TYPES.enterpriseMontlyTurnover, declarationRevenueId: enterprise.id, documents: enterprise.documents
          })
        }
  
        if (declaration.taxeDue === CREATORTAXRATE.QUATERLY && dateMonth % 3 === 0) {
          fileList.push({
            name: `Déclaration CA N°${date.format('Q-YYYY')}`, type: DOCUMENT_TYPES.enterpriseQuaterlyTurnover, declarationRevenueId: enterprise.id, documents: enterprise.documents
          })
        }
        break;
      case 'nonSalarieAgricole':
        if (dateMonth === 1) {
          fileList.push({ name: DOCUMENT_LABELS.declarationOfProfessionalIncome, type: DOCUMENT_TYPES.declarationOfProfessionalIncome, declarationRevenueId: enterprise.id, documents: enterprise.documents });
        }
        break;
      case 'artisteAuteur':
        fileList.push({ name: DOCUMENT_LABELS.artistIncomeStatement, type: DOCUMENT_TYPES.artistIncomeStatement, declarationRevenueId: enterprise.id, documents: enterprise.documents });
        break;
    }
  })

  return fileList;
}

export const getMissingEmployerFiles = (declaration) =>
  declaration.employers.reduce((prev, employer) => {
    if (!employer.hasEndedThisMonth) {
      if (!get(employer, 'documents[0].isTransmitted')) {
        return prev.concat({
          name: employer.employerName,
          type: DOCUMENT_TYPES.salarySheet,
          employerId: employer.id,
        });
      }
      return prev;
    }

    /*
        The salary sheet is optional for users which have already sent their employer certificate,
        in which case we do not count it in the needed documents.
      */
    const hasEmployerCertificate = employer.documents.some(
      ({ type, isTransmitted }) => type === DOCUMENT_TYPES.employerCertificate && isTransmitted,
    );
    const hasSalarySheet = employer.documents.some(
      ({ type, isTransmitted }) => type === DOCUMENT_TYPES.salarySheet && isTransmitted,
    );

    if (hasEmployerCertificate) return prev;

    if (hasSalarySheet) {
      return prev.concat({
        name: employer.employerName,
        type: DOCUMENT_TYPES.employerCertificate,
      });
    }
    return prev.concat(
      { name: employer.employerName, type: DOCUMENT_TYPES.salarySheet, employerId: employer.id },
      { name: employer.employerName, type: DOCUMENT_TYPES.employerCertificate, employerId: employer.id },
    );
  }, []);

export const getDeclarationMissingFilesNb = (declaration, oldDeclaration = null) => {
  const infoDocumentsRequiredNb = declaration.infos.filter(
    ({ type, isTransmitted }) => type !== 'jobSearch' && !isTransmitted,
  ).length;

  const revenues = declaration.revenues || [];
  const nbNeedEntrepriseFile = getMissingEnterprisesFiles(declaration, oldDeclaration)
  .filter(e => e.documents.length === 0 || e.documents.some(d => d.isTransmitted === false)).length;

  return (
    declaration.employers.reduce((prev, employer) => {
      if (!employer.hasEndedThisMonth) {
        return prev + (get(employer, 'documents[0].isTransmitted') ? 0 : 1);
      }

      /*
          The salary sheet is optional for users which have already sent their employer certificate,
          in which case we do not count it in the needed documents.
        */
      const hasEmployerCertificate = employer.documents.some(
        ({ type, isTransmitted }) => type === DOCUMENT_TYPES.employerCertificate && isTransmitted,
      );
      const hasSalarySheet = employer.documents.some(
        ({ type, isTransmitted }) => type === DOCUMENT_TYPES.salarySheet && isTransmitted,
      );

      if (hasEmployerCertificate) return prev + 0;
      return prev + (hasSalarySheet ? 1 : 2);
    }, 0) + infoDocumentsRequiredNb + nbNeedEntrepriseFile);
};

export function getMissingFilesNb(allDeclarations) {
  const declarations = allDeclarations.filter(
    ({ hasFinishedDeclaringEmployers, isFinished }) =>
      hasFinishedDeclaringEmployers && !isFinished,
  )

  const [lastDeclaration, oldDeclaration] = declarations
  if (
    !lastDeclaration ||
    (lastDeclaration.isFinished && declarations.length === 0)
  ) {
    return 0
  }

  return declarations.reduce(
    (prev, decl) => prev + getDeclarationMissingFilesNb(decl, oldDeclaration),
    0,
  )
}

export function isImage(file) {
  if (!file.type) return false;
  return file.type.startsWith('image/');
}

export async function optimizeImage(file) {
  try {
    const blob = await readAndCompressImage(file, {
      quality: 0.8,
      maxWidth: 1500,
      maxHeight: 1500,
      mimeType: 'image/jpeg',
    });
    return new File([blob], file.name, { type: 'image/jpeg' });
  } catch (err) {
    // Optimization failed...
    // We will continue with the unoptimized file
    return file;
  }
}
