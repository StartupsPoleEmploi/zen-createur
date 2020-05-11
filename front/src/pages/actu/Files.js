/* eslint-disable react/jsx-props-no-spreading */
import CircularProgress from '@material-ui/core/CircularProgress';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import withWidth from '@material-ui/core/withWidth';
import { get, noop } from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Check from '@material-ui/icons/Check';
import { withStyles } from '@material-ui/core/styles';
import superagent from 'superagent';
import * as Sentry from '@sentry/browser';

import StatusFilesError from '../../components/Actu/StatusFilesError';
import ActuStatus from '../../components/Generic/actu/ActuStatus';
import { H2, H1 } from '../../components/Generic/Titles';

import {
  fetchDeclarations as fetchDeclarationAction,
  hideEmployerFilePreview as hideEmployerFilePreviewAction,
  hideInfoFilePreview as hideInfoFilePreviewAction,
  removeDeclarationInfoFilePage as removeDeclarationInfoFilePageAction,
  removeEmployerFilePage as removeEmployerFilePageAction,
  showEmployerFilePreview as showEmployerFilePreviewAction,
  showInfoFilePreview as showInfoFilePreviewAction,
  uploadDeclarationInfoFile as uploadDeclarationInfoFileAction,
  uploadEmployerFile as uploadEmployerFileAction,
  validateDeclarationInfoDoc as validateDeclarationInfoDocAction,
  validateEmployerDoc as validateEmployerDocAction,
  userLoogedOut as userLoogedOutAction,
} from '../../redux/actions/declarations';
import DocumentUpload from '../../components/Actu/DocumentUpload';
import FileTransmittedToPE from '../../components/Actu/FileTransmittedToPEDialog';
import LoginAgainDialog from '../../components/Actu/LoginAgainDialog';
import DocumentDialog from '../../components/Generic/documents/DocumentDialog';
import { muiBreakpoints, primaryBlue, secondaryBlue, DEFAULT_ERROR_MESSAGE } from '../../constants';
import { formattedDeclarationMonth } from '../../lib/date';
import { getDeclarationMissingFilesNb, getEnterprisesFiles, isImage, optimizeImage } from '../../lib/file';
import {
  selectPreviewedEmployerDoc,
  selectPreviewedInfoDoc,
  utils,
} from '../../selectors/declarations';
import NotAutorized from '../other/NotAutorized';
import { ucfirst } from '../../utils/utils.tool';
import { DocumentUploadEmployer } from '../../components/Actu/DocumentUploadEmployer';

const { getEmployerLoadingKey, getEmployerErrorKey } = utils;

const CheckIcon = styled(Check)`
  && {
    margin-right: 1rem;
    color: green;
    vertical-align: sub;
  }
`;

const StyledFiles = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90rem;
  width: 100%;
  margin: auto;
  padding-bottom: 2rem;
`;

const StyledTitle = styled(Typography)`
  && {
    margin-bottom: 1.5rem;
    text-align: center;
  }
`;

const MonthInfoTitle = styled(Typography)`
  && {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    text-transform: capitalize;
    color: ${secondaryBlue};
  }
`;

const FilesSection = styled.section`
  max-width: 90rem;
  width: 100%;
  margin: auto;
  padding-bottom: 1rem;

  &:not(:first-child) {
    padding-top: 3rem;
  }
  &:not(:last-child) {
    border-bottom: ${({ width }) => (width === 'xs' ?
    '2px solid rgba(0, 0, 0, 0.1)' :
    '1px solid rgba(0, 0, 0, 0.1)')};
  }
`;

const StyledUl = styled.ul`
  && {
    padding: 0;
  }
`;

const DocumentsGroup = styled.div`
  padding-top: ${({ isOldTab = false }) => (isOldTab ? '1rem' : '3rem')};
  padding-bottom: ${({ isOldTab = false }) => (isOldTab ? '1rem' : '4rem')};
  border-bottom: ${({ isOldTab = false, width }) => (isOldTab ?
    null :
    width === 'xs' ?
      '2px solid rgba(0, 0, 0, 0.1)' :
      '1px solid rgba(0, 0, 0, 0.1)')};
`;

const StyledSup = styled.sup`
  background-color: #ff6237;
  border-radius: 50%;
  width: 1.8rem;
  height: 1.8rem;
  display: inline-block;
  color: #fff;
  font-size: 1rem;
`;

const ActuStatusContainer = styled.div`
  max-width: 50rem;
  margin: ${({ centered }) => (centered ? 'auto' : 'unset')};
  align-self: ${({ width }) => (width !== 'xs' ? 'flex-start' : null)}
  padding-left: ${({ width }) => (width !== 'xs' ? '5rem' : null)}
`;

const Upper = styled.span`
  text-transform: uppercase;
`;

const StyledH2 = styled(H2)`
  && {
    margin-top: 8rem;
    margin-bottom: 4rem;
    font-size: 1.9rem;
    padding-bottom: 0.5rem;
    border-bottom: solid 1px lightgray;
    display: inline-block;
    align-self: ${({ width }) => (width !== 'xs' ? 'flex-start' : null)};
  }
`;

const H1Title = styled(H1)`
  && {
    font-size: 2rem;
    text-align: center;
    margin-bottom: 4rem;
    margin-top: 2rem;
  }
`;
const BlueSpan = styled.span`
  color: ${primaryBlue};
`;

const LabelTypography = styled(Typography).attrs({ variant: 'subtitle1' })`
  && {
    font-size: 1.8rem;
    font-weight: bold;
  }
`;

const Pre = styled.span`
  white-space: pre;
`;

const styles = () => ({
  selected: {
    fontWeight: 'bold',
  },
});

const infoSpecs = [
  {
    name: 'sickLeave',
    fieldToCheck: 'hasSickLeave',
    label: 'Feuille maladie',
    sectionLabel: 'Congé maladie',
    dateFields: ['startDate', 'endDate'],
    multiple: true,
  },
  {
    name: 'internship',
    fieldToCheck: 'hasInternship',
    label: 'Attestation de stage',
    sectionLabel: 'Stage',
    dateFields: ['startDate', 'endDate'],
    multiple: true,
  },
  {
    name: 'maternityLeave',
    fieldToCheck: 'hasMaternityLeave',
    label: 'Attestation de congé maternité',
    sectionLabel: 'Congé maternité',
    dateFields: ['startDate'],
  },
  {
    name: 'retirement',
    fieldToCheck: 'hasRetirement',
    label: 'Attestation retraite',
    sectionLabel: 'Retraite',
    dateFields: ['startDate'],
  },
  {
    name: 'invalidity',
    fieldToCheck: 'hasInvalidity',
    label: 'Attestation invalidité',
    sectionLabel: 'Invalidité',
    dateFields: ['startDate'],
  },
];

const salarySheetType = 'salarySheet';
const employerCertificateType = 'employerCertificate';
const infoType = 'info';

const OLD_MONTHS_TAB = 'oldMonths';
const CURRENT_MONTH_TAB = 'currentMonth';

const formatDate = (date) => moment(date).format('DD MMMM YYYY');
const formatInfoDates = ({ startDate, endDate }) => (!endDate ?
  `À partir du ${formatDate(startDate)}` :
  `Du ${formatDate(startDate)} au ${formatDate(endDate)}`);

// FIXME is this a duplicate with DocumentUpload.types ?
const employerType = 'employer';
const infosType = 'info';
const enterpriseType = 'enterprise';
const computeDocUrl = ({ id, type, file }) => {
  // Note: if employer file is missing, there is no data, so we have to check that the id exists
  // But for infosType, the id exists
  if (type === employerType && !id) return null;
  if (type === infosType && !!file) return null;
  let path = null;

  switch (type) {
    case enterpriseType:
      path = `/api/revenues/files?documentId=${id}`;
      break;
    case employerType:
      path = `/api/employers/files?documentId=${id}`;
      break;
    default:
      path = `/api/declarations/files?declarationInfoId=${id}`;
      break;
  }

  return path;
};

export class Files extends Component {
  constructor(props) {
    super(props);

    const tab = new URL(window.location).searchParams.get('tab');

    this.state = {
      showSkipConfirmation: false,
      skipFileCallback: noop,
      selectedTab: tab && tab === 'old' ? OLD_MONTHS_TAB : CURRENT_MONTH_TAB,
      docsLoading: [],
      errors: {},
      showEnterpriseFilePreview: null
    };
  }

  componentDidMount() {
    this.props.fetchDeclarations();
  }

  componentDidUpdate(prevProps) {
    // Redirect to /thanks if last declaration's last file was just validated
    const prevDeclaration = prevProps.declarations[0];
    const updatedDeclaration = this.props.declarations[0];

    if (!prevDeclaration || !updatedDeclaration) return;
    const missingFilesOnPrevDeclaration = getDeclarationMissingFilesNb(
      prevDeclaration,
    );
    const missingFilesOnUpdatedDeclaration = getDeclarationMissingFilesNb(
      updatedDeclaration,
    );

    if (
      missingFilesOnPrevDeclaration > 0 &&
      missingFilesOnUpdatedDeclaration === 0
    ) {
      return this.props.history.push('/thanks');
    }
  }

  removePage = (data) => (data.type === infoType ?
    this.props.removeDeclarationInfoFilePage(data) :
    this.props.removeEmployerFilePage(data))

  askToSkipFile = (onConfirm) => {
    this.setState({
      showSkipConfirmation: true,
      skipFileCallback: onConfirm,
    });
  }

  closeSkipModal = () => this.setState({
    showSkipConfirmation: false,
    skipFileCallback: noop,
  })

  selectTab = (event, selectedTab) => this.setState({ selectedTab })

  renderDocumentList = (declaration) => {
    const neededAdditionalDocumentsSpecs = infoSpecs.filter(
      (spec) => !!declaration[spec.fieldToCheck],
    );

    const sortedEmployers = declaration.employers.slice();
    sortedEmployers.sort((emp1, emp2) => {
      const emp1MissingFile = emp1.documents.filter((d) => d.isTransmitted)
        .length;
      const emp2MissingFile = emp2.documents.filter((d) => d.isTransmitted)
        .length;
      return emp1MissingFile - emp2MissingFile;
    });

    const isOldTab = this.state.selectedTab === OLD_MONTHS_TAB;
    const missingEnterprisesFiles = getEnterprisesFiles(declaration);

    const infoDocumentsNodes = neededAdditionalDocumentsSpecs.map(
      (neededDocumentSpecs) => (
        <DocumentsGroup
          width={this.props.width}
          key={neededDocumentSpecs.name}
          isOldTab={isOldTab}
        >
          <LabelTypography
            variant="subtitle1"
            component="h2"
            style={{ textTransform: 'uppercase' }}
          >
            {neededDocumentSpecs.sectionLabel}
          </LabelTypography>
          <StyledUl>
            {this.renderDocumentsOfType({
              label: neededDocumentSpecs.label,
              name: neededDocumentSpecs.name,
              multiple: neededDocumentSpecs.multiple,
              declaration,
              allowSkipFile: true,
            })}
          </StyledUl>
        </DocumentsGroup>
      ),
    );

    // do not display a section if there are no documents to display.
    if (sortedEmployers.length + infoDocumentsNodes.length + missingEnterprisesFiles.length === 0) return null;

    return (
      <div>
        {sortedEmployers.map((employer, index) => (
          <DocumentsGroup
            key={employer.id}
            width={this.props.width}
            isOldTab={isOldTab}
            className="employer-row"
          >
            {!isOldTab && (
              <LabelTypography component="h2">
                Employeur&nbsp;:
                {' '}
                {employer.employerName}
              </LabelTypography>
            )}
            <StyledUl>
              {this.renderEmployerRow({
                employer,
                declaration,
                allowSkipFile: true,
                showTooltip: index === 0,
              })}
            </StyledUl>
          </DocumentsGroup>
        ))}

        {missingEnterprisesFiles.length !== 0 && (
          <DocumentsGroup
            key={document.type}
            width={this.props.width}
            isOldTab={isOldTab}
            className="employer-row"
          >
            {!isOldTab && (
              <LabelTypography component="h2">
                Votre entreprise
              </LabelTypography>
            )}
            <StyledUl>
              {this.renderEnterpriseRow({
                documents: missingEnterprisesFiles,
                declaration,
                allowSkipFile: true
              })}
            </StyledUl>
          </DocumentsGroup>
        )}



        <div>{infoDocumentsNodes}</div>
      </div>
    );
  }

  renderDocumentsOfType = ({
    label, name, declaration, allowSkipFile,
  }) => declaration.infos
    .filter(({ type }) => type === name)
    .map((info) => (
      <DocumentUploadEmployer
        key={`${name}-${info.id}`}
        id={info.id}
        type={DocumentUpload.types.info}
        label={label}
        caption={formatInfoDates(info)}
        fileExistsOnServer={!!info.file && !info.isCleanedUp}
        submitFile={this.props.uploadDeclarationInfoFile}
        removePageFromFile={this.removePageFromFile}
        showPreview={this.props.showInfoFilePreview}
        skipFile={(params) => this.askToSkipFile(() => {
          this.props.uploadDeclarationInfoFile({ ...params, skip: true });
          this.closeSkipModal();
        })}
        originalFileName={info.originalFileName}
        allowSkipFile={allowSkipFile}
        isTransmitted={info.isTransmitted}
        declarationInfoId={info.id}
        isLoading={info.isLoading}
        error={info.error}
        useLightVersion={
          muiBreakpoints.xs === this.props.width ||
          muiBreakpoints.sm === this.props.width
        }
      />
    ))

  renderEmployerRow = ({ employer, allowSkipFile, showTooltip }) => {
    const salaryDoc = employer.documents.find(
      ({ type }) => type === salarySheetType,
    );
    const certificateDoc = employer.documents.find(
      ({ type }) => type === employerCertificateType,
    );

    const commonProps = {
      type: DocumentUpload.types.employer,
      submitFile: this.props.uploadEmployerFile,
      showTooltip,
      skipFile: (params) => this.askToSkipFile(() => {
        this.props.uploadEmployerFile({ ...params, skip: true });
        this.closeSkipModal();
      }),
      employerId: employer.id,
      allowSkipFile,
      showPreview: this.props.showEmployerFilePreview,
      useLightVersion:
        muiBreakpoints.xs === this.props.width ||
        muiBreakpoints.sm === this.props.width,
    };

    const isOldTab = OLD_MONTHS_TAB === this.state.selectedTab;

    const salarySheetUpload = (
      <DocumentUploadEmployer
        {...commonProps}
        key={`${employer.id}-${salarySheetType}`}
        id={get(salaryDoc, 'id')}
        label={isOldTab ? employer.employerName : 'Bulletin de salaire'}
        caption={isOldTab ? 'Bulletin de salaire' : null}
        fileExistsOnServer={
          !!get(salaryDoc, 'file') && !get(salaryDoc, 'isCleanedUp')
        }
        removePage={this.removePage}
        isTransmitted={get(salaryDoc, 'isTransmitted')}
        employerDocType={salarySheetType}
        isLoading={employer[getEmployerLoadingKey(salarySheetType)]}
        error={employer[getEmployerErrorKey(salarySheetType)]}
      />
    );

    if (!employer.hasEndedThisMonth) return salarySheetUpload;

    const certificateUpload = (
      <DocumentUploadEmployer
        {...commonProps}
        key={`${employer.id}-${employerCertificateType}`}
        id={get(certificateDoc, 'id')}
        label={isOldTab ? employer.employerName : 'Attestation employeur'}
        caption={isOldTab ? 'Attestation employeur' : null}
        fileExistsOnServer={
          !!get(certificateDoc, 'file') && !get(certificateDoc, 'isCleanedUp')
        }
        removePage={this.removePage}
        isTransmitted={get(certificateDoc, 'isTransmitted')}
        employerDocType={employerCertificateType}
        isLoading={employer[getEmployerLoadingKey(employerCertificateType)]}
        error={employer[getEmployerErrorKey(employerCertificateType)]}
      />
    );

    return (
      <>
        {certificateUpload}
        {certificateDoc && !salaryDoc ? (
          <Typography variant="caption" style={{ fontSize: '1.6rem' }}>
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                paddingRight: '0.5rem',
              }}
            >
              👍
            </span>
            Nous n'avons pas besoin de votre bulletin de salaire pour cet
            employeur, car vous nous avez déjà transmis votre attestation
          </Typography>
        ) : (
            salarySheetUpload
          )}
      </>
    );
  }

  renderEnterpriseRow = ({ documents, declaration, allowSkipFile }) => {
    const commonProps = {
      showTooltip: true,
      //allowSkipFile,
      useLightVersion:
        muiBreakpoints.xs === this.props.width ||
        muiBreakpoints.sm === this.props.width,
    };

    const declarationRevenueId = declaration.revenues && declaration.revenues.length ? declaration.revenues[0].id : null;
    const filesSents = declaration.revenues && declaration.revenues.length ? declaration.revenues[0].documents : null;

    const documentByTypes = (type) => filesSents.find(d => d.type === type) || null;

    return (
      <>
        {documents.map(doc => {
          const docType = documentByTypes(doc.type) || { id: `${doc.name}-${doc.type}` };

          return (<DocumentUpload
            {...commonProps}
            key={`revenue-${docType.id}`}
            submitFile={(params) => this.sentRevenuesDocumentation({ ...params, type: doc.type, declarationRevenueId, id: docType.id })}
            skipFile={(params) => this.askToSkipFile(() => {
              this.sentRevenuesDocumentation({ type: doc.type, declarationRevenueId, id: docType.id })
              this.closeSkipModal();
            })}
            label={doc.name}
            fileExistsOnServer={
              !!get(documentByTypes(doc.type), 'file') && !get(documentByTypes(doc.type), 'isCleanedUp')
            }
            showPreview={() => this.setState({ showEnterpriseFilePreview: docType })}
            isTransmitted={get(documentByTypes(doc.type), 'isTransmitted')}
            isLoading={this.state.docsLoading.indexOf(`revenue-${docType.id}`) !== -1}
            error={this.state.errors[`revenue-${docType.id}`] || null}
          />)
        })}
      </>
    );
  }

  // TODO centralise
  catchQueryError = (err) => {
    if (err.status === 401 || err.status === 403) {
      this.props.userLoogedOut();
    }

    throw 'Erreur lors de la validation du justificatif, merci de bien vouloir réessayer ultérieurement';

    Sentry.captureException(err);
  }

  sentRevenuesDocumentation = async ({ id, file, type, declarationRevenueId }) => {
    let fileSent;
    const errormsg = () => {
      this.loadingDocument(`revenue-${id}`, false);
      this.setError(`revenue-${id}`, DEFAULT_ERROR_MESSAGE);
    }

    this.loadingDocument(`revenue-${id}`, true);

    if (file) {
      try {
        fileSent = await this.uploadFile({ file });
      } catch (err) {
      }
    }

    console.log('file', file, fileSent)
    // TODO ecrease this feature
    if (file && (!fileSent || !fileSent.body.file)) {
      // check if PE is available
      errormsg();
      return;
    }


    let url = '/api/revenues/files';

    return superagent
      .post(url, { file: fileSent ? fileSent.body.file : null, type, declarationRevenueId, originalFileName: file ? file.name : null })
      .set('CSRF-Token', this.props.csrfToken)
      .then(document => { if (file) return this.setState({ showEnterpriseFilePreview: document.body }) })
      .then(this.props.fetchDeclarations) // TODO update only delta
      .then(() =>
        this.loadingDocument(`revenue-${id}`, false))
      .then(() => this.setError(`revenue-${id}`))
      .catch(this.catchQueryError)
      .catch(errormsg)
  }

  uploadFile = async ({ file, fileName = null }) => {
    let url = '/api/files';

    let request = superagent
      .post(url)
      .set('CSRF-Token', this.props.csrfToken)

    const fileToSubmit = isImage(file) ? await optimizeImage(file) : file;
    request = request.attach('document', fileToSubmit);
    if (fileName) {
      request = request.field('fileName', fileName);
    }

    return request
      .catch(this.catchQueryError);
  };

  addPage = ({ file, fileName = null }) => {
    return this.uploadFile({ file, fileName })
      .then(this.props.fetchDeclarations) // TODO update only delta
      .catch(this.catchQueryError)
  };

  removePage = ({ file, pageNumberToRemove }) => {
    return superagent
      .post(
        '/api/files/remove-file-page', { pageNumberToRemove, file }
      )
      .set('Content-Type', 'application/json')
      .set('CSRF-Token', this.props.csrfToken)
      .then(this.props.fetchDeclarations) // TODO update only delta
      .catch(this.catchQueryError)
  };

  onValidateRevenues = ({ id }) => {
    this.loadingDocument(`revenue-${id}`, true);

    return superagent
      .post(
        '/api/revenues/validateDocument', { id }
      )
      .set('Content-Type', 'application/json')
      .set('CSRF-Token', this.props.csrfToken)
      .then(this.props.fetchDeclarations) // TODO update only delta
      .then(() => this.loadingDocument(`revenue-${id}`, false))
      .then(() => this.setError(`revenue-${id}`))
      .then(this.unselectAll)
      .catch(this.catchQueryError)
      .catch(error => {
        this.loadingDocument(`revenue-${id}`, false);
        this.setError(`revenue-${id}`, error);
      })
  };

  loadingDocument = (key, load) => {
    const docsLoading = this.state.docsLoading;
    const docsLoadingIndex = docsLoading.indexOf(key);

    if (load && docsLoadingIndex === -1) {
      docsLoading.push(key);
    }

    if (!load && docsLoadingIndex !== -1) {
      docsLoading.splice(docsLoadingIndex, 1);
    }

    this.setState({ docsLoading })
  }

  unselectAll = () => {
    this.setState({ showEnterpriseFilePreview: null })
  }

  setError = (key, message) => {
    const errors = this.state.errors;

    if (message) {
      errors[key] = message
    } else {
      delete errors[key];
    }

    this.setState({ errors });
  }


  renderCurrentMonthTab = (lastDeclaration) => {
    const { activeMonth, user, declarations } = this.props;

    if (
      activeMonth &&
      (!lastDeclaration || !lastDeclaration.hasFinishedDeclaringEmployers)
    ) {
      if (user.isBlocked) {
        return (
          <div style={{ marginTop: '3rem' }}>
            <NotAutorized showIcon={false} />
          </div>
        );
      }

      return (
        <ActuStatusContainer
          centered={false}
          width={this.props.width}
          style={{ marginTop: '5rem' }}
        >
          <ActuStatus
            activeMonth={activeMonth}
            user={user}
            showTitle={false}
            declarations={declarations}
            declaration={lastDeclaration}
          />
        </ActuStatusContainer>
      );
    }

    // Not in declaration time => last actu done is used
    return lastDeclaration.isFinished ? (
      <ActuStatusContainer
        style={{
          paddingLeft: this.props.width !== 'xs' ? '2rem' : null,
        }}
      >
        <StyledH2 width={this.props.width}>
          Actualisation -
          {' '}
          <Upper>{moment(lastDeclaration).format('MMMM YYYY')}</Upper>
        </StyledH2>

        <Typography style={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
          <CheckIcon />
          <Upper>Vous n'avez pas de justificatifs à envoyer</Upper>
        </Typography>
      </ActuStatusContainer>
    ) : (
        this.renderSection(lastDeclaration)
      );
  }

  renderSection = (declaration) => {
    const declarationRemainingDocsNb = getDeclarationMissingFilesNb(declaration);

    const formattedMonth = formattedDeclarationMonth(
      declaration.declarationMonth.month,
    );

    // FIXME : if declarationRemainingDocsNb === 9, isFinished should be true
    // however as sending employers does not for now refresh the whole declaration
    // the object in the store main not be updated.
    // This should be changed as the next look for this page is implemented.
    if (declaration.isFinished || declarationRemainingDocsNb === 0) {
      return null;
    }

    const isOldTab = OLD_MONTHS_TAB === this.state.selectedTab;

    return (
      <FilesSection key={declaration.id} width={this.props.width}>
        {isOldTab && (
          <MonthInfoTitle variant="h6" component="h2">
            {formattedMonth}
          </MonthInfoTitle>
        )}
        {this.renderDocumentList(declaration)}
      </FilesSection>
    );
  }

  render() {
    const {
      declarations: allDeclarations,
      declaration: activeDeclaration,
      isLoading,
      previewedEmployerDoc,
      previewedInfoDoc,
      hideEmployerFilePreview,
      hideInfoFilePreview,
      uploadEmployerFile,
      uploadDeclarationInfoFile,
      removeEmployerFilePage,
      removeDeclarationInfoFilePage,
      validateEmployerDoc,
      isFilesServiceUp,
      validateDeclarationInfoDoc,
      activeMonth,
      user,
      classes,
      width,
    } = this.props;
    const {
      showEnterpriseFilePreview
    } = this.state;

    if (isLoading) {
      return (
        <StyledFiles>
          <CircularProgress />
        </StyledFiles>
      );
    }

    if (!isFilesServiceUp) {
      return (
        <StyledFiles>
          <StatusFilesError />
        </StyledFiles>
      );
    }

    // display filter : In the case of old declarations displayed,
    // a declaration which had been abandonned by a user at step 2
    // could theoretically be here if the user came back later.
    // We remove that possibility.
    const declarations = allDeclarations.filter(
      ({ hasFinishedDeclaringEmployers }) => hasFinishedDeclaringEmployers,
    );

    /**
      The code above needs some explanations :

      By default, we used the last declaration done (if exists) and consider all the other declarations as the old declarations.
      But on a declaration period, we consider the current declaration as the last declaration (which could be null if the declaration is not started).
    */
    let lastDeclaration = declarations[0];
    if (
      activeMonth &&
      (!activeDeclaration || !activeDeclaration.hasFinishedDeclaringEmployers)
    ) {
      lastDeclaration = activeDeclaration;
    }

    const oldDeclarations = activeMonth && activeDeclaration ? declarations.slice(1) : declarations;

    const areUnfinishedDeclarations = oldDeclarations.some(
      ({ isFinished }) => !isFinished,
    );

    if (
      activeMonth &&
      !lastDeclaration &&
      !areUnfinishedDeclarations &&
      !user.isBlocked
    ) {
      return (
        <ActuStatusContainer>
          <ActuStatus
            activeMonth={activeMonth}
            user={user}
            declarations={declarations}
            declaration={lastDeclaration}
          />
        </ActuStatusContainer>
      );
    }

    // Users have come to this page without any old documents to validate
    if (
      !activeMonth &&
      (!lastDeclaration || lastDeclaration.isFinished) &&
      !areUnfinishedDeclarations
    ) {
      return (
        <StyledFiles>
          <StyledTitle variant="h6" component="h1">
            Vous n'avez pas de fichier à envoyer.
          </StyledTitle>
        </StyledFiles>
      );
    }

    const lastDeclarationMissingFiles = lastDeclaration &&
      lastDeclaration.hasFinishedDeclaringEmployers ?
      getDeclarationMissingFilesNb(lastDeclaration) :
      0;

    const oldDeclarationsMissingFiles = oldDeclarations.reduce(
      (prev, declaration) => {
        if (
          !declaration.hasFinishedDeclaringEmployers ||
          declaration.isFinished
        ) {
          return prev;
        }
        return prev + getDeclarationMissingFilesNb(declaration);
      },
      0,
    );
    const totalMissingFiles = lastDeclarationMissingFiles + oldDeclarationsMissingFiles;

    const showEmployerPreview = !!get(previewedEmployerDoc, 'file');
    const showInfoDocPreview = !!get(previewedInfoDoc, 'file');

    let previewProps = null;

    if (showEmployerPreview) {
      previewProps = {
        onCancel: hideEmployerFilePreview,
        submitFile: uploadEmployerFile,
        removePage: removeEmployerFilePage,
        validateDoc: validateEmployerDoc,
        url: computeDocUrl({ id: previewedEmployerDoc.id, type: employerType }),
        employerDocType: previewedEmployerDoc.type, // renaming it to avoid confusion
        ...previewedEmployerDoc,
      };
    } else if (showInfoDocPreview) {
      previewProps = {
        onCancel: hideInfoFilePreview,
        submitFile: uploadDeclarationInfoFile,
        removePage: removeDeclarationInfoFilePage,
        validateDoc: validateDeclarationInfoDoc,
        url: computeDocUrl({ id: previewedInfoDoc.id, type: infoType }),
        ...previewedInfoDoc,
      };
    } else if (showEnterpriseFilePreview) {
      previewProps = {
        onCancel: this.unselectAll,
        submitFile: (file) => this.addPage({ ...file, fileName: showEnterpriseFilePreview.file }),
        removePage: (tabToRemove) =>
          this.removePage({ ...tabToRemove, ...showEnterpriseFilePreview })
        ,
        error: this.state.errors[`revenue-${showEnterpriseFilePreview.id}`] || null,
        validateDoc: () => this.onValidateRevenues(showEnterpriseFilePreview),
        url: computeDocUrl({ id: showEnterpriseFilePreview.id, type: enterpriseType }),
        ...showEnterpriseFilePreview,
        isLoading: this.state.docsLoading.indexOf(`revenue-${showEnterpriseFilePreview.id}`) !== -1
      };
    }

    return (
      <>
        <H1Title style={{ fontSize: '2rem' }}>
          Vous avez
          {' '}
          <BlueSpan>{totalMissingFiles}</BlueSpan>
          {' '}
          {totalMissingFiles > 1 ? 'justificatifs' : 'justificatif'}
          {' '}
          à
          transmettre
        </H1Title>

        <StyledFiles>
          <Tabs
            value={this.state.selectedTab}
            onChange={this.selectTab}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            style={{ width: '100%' }}
          >
            <Tab
              value={CURRENT_MONTH_TAB}
              classes={{ selected: classes.selected }}
              label={(
                <Pre style={{ color: '#000', fontSize: '1.6rem' }}>
                  {formattedDeclarationMonth(
                    lastDeclaration ?
                      lastDeclaration.declarationMonth.month :
                      activeMonth.month,
                  )}
                  {' '}
                  <StyledSup>{lastDeclarationMissingFiles}</StyledSup>
                </Pre>
              )}
            />
            <Tab
              style={{ color: '#000' }}
              value={OLD_MONTHS_TAB}
              classes={{ selected: classes.selected }}
              label={(
                <div style={{ color: '#000', fontSize: '1.6rem' }}>
                  {width === 'xs' ? (
                    <Pre>
                      Précédents
                      {' '}
                      <StyledSup>{oldDeclarationsMissingFiles}</StyledSup>
                    </Pre>
                  ) : (
                      <>
                        Mois
                        {' '}
                        <Pre>
                          précédents
                        {' '}
                          <StyledSup>{oldDeclarationsMissingFiles}</StyledSup>
                        </Pre>
                      </>
                    )}
                </div>
              )}
            />
          </Tabs>

          {this.state.selectedTab === CURRENT_MONTH_TAB &&
            this.renderCurrentMonthTab(lastDeclaration, false)}

          {this.state.selectedTab === OLD_MONTHS_TAB &&
            (oldDeclarationsMissingFiles > 0 ? (
              oldDeclarations.map(this.renderSection)
            ) : (
                <FilesSection>
                  <StyledTitle
                    variant="h6"
                    component="h1"
                    style={
                      this.props.width !== 'xs' ?
                        {
                          textAlign: 'right',
                          paddingRight: '2rem',
                        } :
                        null
                    }
                  >
                    Pas de justificatifs à envoyer
                </StyledTitle>
                </FilesSection>
              ))}

          <LoginAgainDialog isOpened={this.props.isUserLoggedOut} />
          <FileTransmittedToPE
            isOpened={this.state.showSkipConfirmation}
            onCancel={this.closeSkipModal}
            onConfirm={this.state.skipFileCallback}
          />
          {(previewProps) && (
            <DocumentDialog isOpened {...previewProps} />
          )}
        </StyledFiles>
      </>
    );
  }
}

Files.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
    replace: PropTypes.func.isRequired,
  }).isRequired,
  activeMonth: PropTypes.instanceOf(Date).isRequired,
  user: PropTypes.object.isRequired,
  declaration: PropTypes.object,
  token: PropTypes.string.isRequired,
  declarations: PropTypes.arrayOf(PropTypes.object),
  fetchDeclarations: PropTypes.func.isRequired,
  removeDeclarationInfoFilePage: PropTypes.func.isRequired,
  removeEmployerFilePage: PropTypes.func.isRequired,
  uploadEmployerFile: PropTypes.func.isRequired,
  uploadDeclarationInfoFile: PropTypes.func.isRequired,
  hideEmployerFilePreview: PropTypes.func.isRequired,
  hideInfoFilePreview: PropTypes.func.isRequired,
  previewedEmployerDoc: PropTypes.object,
  previewedEnterpriseDoc: PropTypes.object,
  previewedInfoDoc: PropTypes.object,
  showInfoFilePreview: PropTypes.func.isRequired,
  showEmployerFilePreview: PropTypes.func.isRequired,
  showEnterpriseFilePreview: PropTypes.func,
  validateEmployerDoc: PropTypes.func.isRequired,
  validateDeclarationInfoDoc: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  activeDeclaration: PropTypes.object,
  isUserLoggedOut: PropTypes.bool.isRequired,
  isFilesServiceUp: PropTypes.bool.isRequired,
  width: PropTypes.string,
  classes: PropTypes.object,
  userLoogedOut: PropTypes.func.isRequired,
};

export default connect(
  (state) => ({
    declarations: state.declarationsReducer.declarations,
    isLoading: state.declarationsReducer.isLoading,
    previewedEmployerDoc: selectPreviewedEmployerDoc(state),
    previewedInfoDoc: selectPreviewedInfoDoc(state),
    isFilesServiceUp: state.statusReducer.isFilesServiceUp,
    activeMonth: state.activeMonthReducer.activeMonth,
    user: state.userReducer.user,
    csrfToken: state.userReducer.user.csrfToken,
    isUserLoggedOut: !!(
      state.userReducer.user && state.userReducer.user.isLoggedOut
    ),
  }),
  {
    fetchDeclarations: fetchDeclarationAction,
    uploadEmployerFile: uploadEmployerFileAction,
    uploadDeclarationInfoFile: uploadDeclarationInfoFileAction,
    removeEmployerFilePage: removeEmployerFilePageAction,
    removeDeclarationInfoFilePage: removeDeclarationInfoFilePageAction,
    showEmployerFilePreview: showEmployerFilePreviewAction,
    showInfoFilePreview: showInfoFilePreviewAction,
    hideEmployerFilePreview: hideEmployerFilePreviewAction,
    hideInfoFilePreview: hideInfoFilePreviewAction,
    validateEmployerDoc: validateEmployerDocAction,
    validateDeclarationInfoDoc: validateDeclarationInfoDocAction,
    userLoogedOut: userLoogedOutAction,
  },
)(withWidth()(withStyles(styles)(Files)));
