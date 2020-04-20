import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import withWidth from '@material-ui/core/withWidth';
import Add from '@material-ui/icons/Add';
import {
  isNaN as _isNaN,
  cloneDeep,
  get,
  isBoolean,
  isNull,
  isObject,
  isUndefined,
  pick,
} from 'lodash';
import moment from 'moment';
import { PropTypes } from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import superagent from 'superagent';

import { Box } from '@material-ui/core';
import {
  fetchDeclarations as fetchDeclarationsAction,
  postEmployers as postEmployersAction,
} from '../../redux/actions/declarations';
import DeclarationDialogsHandler from '../../components/Actu/DeclarationDialogs/DeclarationDialogsHandler';
import EmployerQuestion from '../../components/Actu/EmployerQuestion';
import LoginAgainDialog from '../../components/Actu/LoginAgainDialog';
import PreviousEmployersDialog from '../../components/Actu/PreviousEmployersDialog';
import AlwaysVisibleContainer from '../../components/Generic/AlwaysVisibleContainer';
import MainActionButton from '../../components/Generic/MainActionButton';
import {
  intermediaryBreakpoint,
  mobileBreakpoint,
  primaryBlue,
  CREATORTAXRATE,
  TIMEWORKED,
  MAXHOURCANWORK,
} from '../../constants';
import {
  MAX_SALARY,
  MAX_WORK_HOURS,
  MIN_SALARY,
  MIN_WORK_HOURS,
  SALARY,
  TURNOVER,
  WORK_HOURS,
  WORK_HOURS_CREATOR,
  MIN_WORK_HOURS_CREATOR,
  MAX_WORK_HOURS_CREATOR,
  MIN_TURNOVER,
  MAX_TURNOVER,
} from '../../lib/salary';
import { setNoNeedEmployerOnBoarding as setNoNeedEmployerOnBoardingAction } from '../../redux/actions/user';
import { ucfirst } from '../../utils/utils.tool';
import { CreatorQuestion } from '../../components/Actu/CreatorQuestion';

const StyledEmployers = styled.div`
  padding-bottom: 4rem;

  @media (max-width: ${mobileBreakpoint}) {
    padding-bottom: 0;
  }
`;

const Title = styled(Typography)`
  && {
    font-weight: 400;
    padding-bottom: 1.5rem;
  }
`;

const AddEmployersButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 3rem 0;
`;

const AddEmployersButton = styled(Button)`
  && {
    margin: 0 5rem;
    min-height: 5.5rem;
    color: black;
    white-space: nowrap;

    @media (max-width: ${intermediaryBreakpoint}) {
      margin: 0 3rem;
    }
  }
`;

const LineDiv = styled.div`
  flex: 1;
  max-width: 16.6rem;
  height: 0.1rem;
  background-color: #e4e4e4;
`;
const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  text-align: center;
  max-width: 40rem;
  margin: 0 auto;
`;

const ErrorMessage = styled(Typography).attrs({
  paragraph: true,
})`
  && {
    color: red;
    text-align: center;
    margin: auto;
    margin-bottom: 2rem;
    max-width: 70rem;
  }
`;

const StyledAlwaysVisibleContainer = styled(AlwaysVisibleContainer)`
  && {
    @media (max-width: 550px) {
      padding: 2rem 1rem;
    }
  }
`;

const StyledMainAction = styled(MainActionButton)`
  && {
    @media (max-width: ${mobileBreakpoint}) {
      width: 17rem;
    }
  }
`;

const BoxPanel = styled.div`
  margin: 20px auto 0 auto;
  padding: 0 40px;
  width: 520px;

  p {
    font-size: 16px;
    line-height: 24px;
  }
`;

const Block = styled.div`
  border-radius: 15px;
  background-color: #FAFAFA;
  padding: 20px 40px;
`;

const StyleContainerBlock = styled.div`
  display: inline-block;
`;


const employerTemplate = {
  employerName: { value: '', error: null },
  workHours: { value: '', error: null },
  salary: { value: '', error: null },
  hasEndedThisMonth: { value: null, error: null },
};

const enterpriseTemplate = {
  workHoursCreator: { value: MIN_WORK_HOURS, error: null },
  turnover: { value: '', error: null },
  timeWorked: { value: '', error: null },
};

const getEmployersMapFromFormData = (employers) =>
  employers.map((employerFormData) =>
    Object.keys(employerFormData).reduce(
      (obj, fieldName) => ({
        ...obj,
        [fieldName]: employerFormData[fieldName].value,
      }),
      {},
    ));

// TODO refactor this, repeated almost exactly in WorkSummary
const calculateTotal = (employers, field) => {
  const total = employers.reduce((prev, employer) => {
    const number = parseFloat(
      isObject(employer[field]) ? employer[field].value : employer[field],
    );
    return number + prev;
  }, 0);
  return total;
};

// TODO the whole logic of this component needs to be sanitized
export class Employers extends Component {
  static propTypes = {
    activeMonth: PropTypes.instanceOf(Date).isRequired,
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
      replace: PropTypes.func.isRequired,
    }).isRequired,
    user: PropTypes.shape({
      needEmployerOnBoarding: PropTypes.bool.isRequired,
      csrfToken: PropTypes.string.isRequired,
    }),
    width: PropTypes.string,
    declarations: PropTypes.arrayOf(PropTypes.object),
    fetchDeclarations: PropTypes.func.isRequired,
    postEmployers: PropTypes.func.isRequired,
    setNoNeedEmployerOnBoarding: PropTypes.func.isRequired,
  }

  state = {
    employers: [{ ...employerTemplate }],
    enterprises: [{ ...enterpriseTemplate }],
    previousEmployers: [],
    isLoading: true,
    error: null,
    isDialogOpened: false,
    showPreviousEmployersModal: false,
    consistencyErrors: [],
    validationErrors: [],
    isValidating: false,
    isLoggedOut: false,
    selectedEmployer: 0,
    selectedEnterprise: 0,
    isFormValid: false,
  }

  componentDidMount() {
    this.props
      .fetchDeclarations({ limit: 2 })
      .then(() => {
        const [
          currentDeclaration,
          previousDeclaration,
        ] = this.props.declarations;

        if (currentDeclaration.hasFinishedDeclaringEmployers) {
          return this.props.history.replace('/files');
        }

        this.setState({ currentDeclaration });

        if (currentDeclaration.employers.length === 0) {
          if (!previousDeclaration) return;

          const relevantPreviousEmployers = previousDeclaration.employers.filter(
            (employer) => !employer.hasEndedThisMonth,
          );
          if (relevantPreviousEmployers.length === 0) return;

          return this.setState({
            employers: relevantPreviousEmployers.map((employer) => ({
              ...employerTemplate,
              employerName: {
                value: employer.employerName,
                error: null,
              },
            })),
            previousEmployers: relevantPreviousEmployers,
            showPreviousEmployersModal: true,
          });
        }

        this.setState({
          employers: currentDeclaration.employers.map((employer) => Object.keys(
            pick(employer, [
              'employerName',
              'workHours',
              'salary',
              'hasEndedThisMonth',
              'id',
            ]),
          ).reduce(
            (obj, fieldName) => ({
              ...obj,
              [fieldName]: {
                value: employer[fieldName],
                error: null,
              },
            }),
            {},
          )),
        });
      })
      .then(() => this.setState({ isLoading: false }));
  }

  componentWillUnmount() {
    // Save at exit, but avoid saving in case where the user is redirected somewhere else
    // So we make sure data was loaded, and curent declaration
    // hasn't been validated for employers,yet
    if (
      !this.state.isLoading &&
      !this.hasSubmittedAndFinished &&
      get(this.state.currentDeclaration, 'hasFinishedDeclaringEmployers') ===
      false
    ) {
      this.onSave();
    }
  }


  getFieldError({ name, value, from }) {
    const isValid = !isNull(value) && !isUndefined(value) && value !== '';

    if (from === 'enterprises' && !isValid) {
    // specific rules for entreprises
      // const declaration =
      switch (name) {
        case TURNOVER:
          break;
        default: break;
      }
    }

    if (!isValid) return 'Champ obligatoire';

    if (name === WORK_HOURS) {
      if (_isNaN(value)) {
        return 'Merci de ne saisir que des chiffres';
      }
      if (value < MIN_WORK_HOURS || value > MAX_WORK_HOURS) {
        return 'Merci de corriger le nombre d\'heures travaillées';
      }
    }

    if (name === WORK_HOURS_CREATOR) {
      if (_isNaN(value)) {
        return 'Merci de ne saisir que des chiffres';
      }
      if (value < MIN_WORK_HOURS_CREATOR || value > MAX_WORK_HOURS_CREATOR) {
        return 'Merci de corriger le nombre d\'heures travaillées';
      }
    }

    if (name === TURNOVER) {
      if (_isNaN(value)) {
        return 'Merci de ne saisir que des chiffres';
      }
      if (value < MIN_TURNOVER || value > MAX_TURNOVER) {
        return 'Merci de corriger votre chiffre d\'affaire';
      }
    }

    if (name === SALARY) {
      if (_isNaN(value)) {
        return 'Merci de ne saisir que des chiffres';
      }
      if (value < MIN_SALARY || value > MAX_SALARY) {
        return 'Merci de corriger votre salaire';
      }
    }

    if (name === 'hasEndedThisMonth' && !isBoolean(value)) {
      return 'Merci de répondre à la question';
    }
  }

  addEmployer = () => this.setState(({ employers }) => ({
    employers: employers.concat({ ...employerTemplate }),
    selectedEmployer: employers.length,
  }))

  // onChange - let the user type whatever he wants, show errors
  onChange = ({
    index, name, value, from, ignoreError = false, ignoreUndefined = true,
  }) => {
    let error = null;

    if (!ignoreError &&
      ((value !== undefined && ignoreUndefined === true) ||
      (value === undefined && ignoreUndefined === false))) {
      error = this.getFieldError({ name, value, from });
    }

    this.updateValue({
      index, name, value, error, from,
    });
  }

  updateValue = ({
    index, name, value, error, from,
  }) =>
    this.setState(({ [from]: prevEmployers }) => ({
      [from]: prevEmployers.map((employer, key) =>
        (key === index ? { ...employer, [name]: { value, error } } : employer)),
      error: null,
    }), () => { if (!error) this.checkFormValidity({ getErrorText: false }); });


  onRemove = (index, from = 'employers') => {
    let selectedEmployer = index;
    if (this.state.selectedEmployer === index) {
      selectedEmployer = index - 1;
    }

    this.setState(({ [from]: employers }) => ({
      [from]: employers.filter((e, key) => key !== index),
      selectedEmployer,
    }));
  }

  onSave = () => this.props.postEmployers({
    employers: getEmployersMapFromFormData(this.state.employers),
  })

  saveAndRedirect = () => this.onSave().then(() => this.props.history.push('/thanks?later'))

  onSubmit = ({ ignoreErrors = false } = {}) => {
    this.setState({ isValidating: true });

    return this.props
      .postEmployers({
        employers: getEmployersMapFromFormData(this.state.employers),
        isFinished: true,
        ignoreErrors,
      })
      .then(() => {
        this.hasSubmittedAndFinished = true; // used to cancel cWU actions
        this.props.history.push('/files');
      })
      .catch((err) => {
        if (
          err.status === 400 &&
          (get(err, 'response.body.consistencyErrors.length', 0) ||
            get(err, 'response.body.validationErrors.length', 0))
        ) {
          // We handle the error inside the modal
          return this.setState({
            consistencyErrors: err.response.body.consistencyErrors,
            validationErrors: err.response.body.validationErrors,
            isValidating: false,
          });
        }

        // Reporting here to get a metric of how much next error happens
        window.Raven.captureException(err);

        if (err.status === 401 || err.status === 403) {
          this.closeDialog();
          this.setState({ isLoggedOut: true });
          return;
        }

        // Unhandled error
        this.setState({
          error: `Nous sommes désolés, mais une erreur s'est produite. Merci de réessayer ultérieurement.
          Si le problème persiste, merci de contacter l'équipe Zen, et d'effectuer
          en attendant votre actualisation sur Pole-emploi.fr.`,
        });
        this.closeDialog();
      });
  }

  checkFormValidity = ({ getErrorText = true }) => {
    if (this.state.employers.length === 0) {
      this.setState({
        error: 'Merci d\'entrer les informations sur vos employeurs',
      });
      return false;
    }

    let isFormValid = true;
    const datas = {
      employers: cloneDeep(this.state.employers),
      enterprises: cloneDeep(this.state.enterprises),
    };

    const formControl = (row, index, node) => Object.keys(row).forEach((fieldName) => {
      let { value } = row[fieldName];
      let checkError = true;

      // doesn't check turnover with quaterly declartation
      if (node === 'enterprises' && fieldName === TURNOVER && this.props.declarations && this.props.declarations.length && this.props.declarations[0].taxeDue === CREATORTAXRATE.QUATERLY) {
        checkError = false;
      }


      // set min and max to no declaration hour
      if (fieldName === WORK_HOURS && node === 'enterprises' && this.state.enterprises && this.state.enterprises.length) {
        if (this.state.enterprises[0].timeWorked === TIMEWORKED.NO) {
          value = MIN_WORK_HOURS;
        }

        if (this.state.enterprises[0].timeWorked === TIMEWORKED.FULL) {
          value = MAXHOURCANWORK;
        }
      }


      let error = null;
      if (checkError) {
        error = this.getFieldError({
          name: fieldName,
          value,
          ignoreUndefined: false,
          from: node,
        });
      }

      if (error) isFormValid = false;

      datas[node][index][fieldName] = {
        value: row[fieldName].value,
        error: getErrorText ? error : null,
      };
    });
    this.state.employers.forEach((row, index) => formControl(row, index, 'employers'));
    this.state.enterprises.forEach((row, index) => formControl(row, index, 'enterprises'));

    let error = 'Merci de corriger les erreurs du formulaire. ';

    if (isFormValid) {
      const salaryTotal = calculateTotal(datas.employers, SALARY);

      if (salaryTotal > MAX_SALARY) {
        error += `Vous ne pouvez pas déclarer plus de ${MAX_SALARY}€ total de salaire. `;
        isFormValid = false;
      }
    }

    this.setState({
      ...datas,
      isFormValid,
      error: !isFormValid && getErrorText ? error : null,
    });

    return isFormValid;
  }

  openDialog = () => {
    const isValid = this.checkFormValidity({ getErrorText: true });
    if (isValid) {
      this.setState({ isDialogOpened: true });
    }
  }

  closeDialog = () => {
    this.setState({
      consistencyErrors: [],
      validationErrors: [],
      isDialogOpened: false,
      isValidating: false,
    });
  }

  onEmployerOnBoardingEnd = () => superagent
    .post('/api/user/disable-need-employer-on-boarding')
    .set('CSRF-Token', this.props.user.csrfToken)
    .then(() => this.props.setNoNeedEmployerOnBoarding())

  closePreviousEmployersModal = () => this.setState({ showPreviousEmployersModal: false })

  onCollapsed = (index) => {
    if (this.state.selectedEmployer === index) {
      this.setState({ selectedEmployer: -1 });
    } else {
      this.setState({ selectedEmployer: index });
    }
  }

  renderEmployerQuestion = (data, index) => (
    <EmployerQuestion
      {...data}
      key={index}
      index={index}
      onChange={this.onChange}
      onRemove={() => this.onRemove(index, 'employers')}
      onCollapsed={() => this.onCollapsed(index)}
      defaultName={`Employeur ${index + 1}`}
      collapsed={this.state.selectedEmployer !== index}
      showCollapsedTitle={this.state.employers.length > 1}
      canRemove={this.state.employers.length > 1}
      activeMonth={this.props.activeMonth}
    />
  )

  renderEmployerPanel = () => {
    const { employers } = this.state;

    return (
      <>
        {this.props.declarations[0].hasEmployers && (
        <Box flex={1}>
          <BoxPanel style={{ marginTop: '70px' }}>
            <Title variant="h6" component="h1" style={{ marginLeft: '40px' }}>
              <b>{employers.length > 1 ? 'MES EMPLOYEURS' : 'MON EMPLOYEUR'}</b>
              {' '}
              -
              {' '}
              {ucfirst(moment(this.props.activeMonth).format('MMMM YYYY'))}
            </Title>
            <Block style={{ backgroundColor: 'transparent' }}>
              {employers.length <= 1 && (
              <p>
                Pour quel employeur avez-vous travaillé
                <br />
                en
                {' '}
                {moment(this.props.activeMonth).format('MMMM YYYY')}
                {' '}
                ?
              </p>
              )}
              {employers.map(this.renderEmployerQuestion)}
            </Block>
            <AddEmployersButtonContainer>
              <LineDiv />
              <AddEmployersButton
                variant="outlined"
                color="primary"
                onClick={this.addEmployer}
              >
                <Add style={{ marginRight: '1rem', color: primaryBlue }} />
                Ajouter un employeur
              </AddEmployersButton>
              <LineDiv />
            </AddEmployersButtonContainer>
          </BoxPanel>
        </Box>
        )}
      </>
    );
  }

  renderCreatorQuestion = (data, index) => {
    const needTurnover = this.props.declarations[0].taxeDue === CREATORTAXRATE.MONTHLY;

    return (
      <CreatorQuestion
        {...data}
        key={index}
        index={index}
        onChange={this.onChange}
        defaultName={`Entreprise ${index + 1}`}
        collapsed={this.state.selectedEnterprise !== index}
        showCollapsedTitle={this.state.enterprises.length > 1}
        needTurnover={needTurnover}
        canRemove={this.state.enterprises.length > 1}
        activeMonth={this.props.activeMonth}
      />
    );
  }

  renderCreatorPanel = () => {
    const { enterprises } = this.state;


    return (
      <>
        {this.props.declarations[0].taxeDue && (
        <Box flex={1}>
          <BoxPanel>
            <Block style={{ paddingTop: '50px' }}>
              <Title variant="h6" component="h1">
                <b>{enterprises.length > 1 ? 'MES ENTREPRISES' : 'MON ENTREPRISE'}</b>
                {' '}
                -
                {' '}
                {ucfirst(moment(this.props.activeMonth).format('MMMM YYYY'))}
              </Title>
              {enterprises.map(this.renderCreatorQuestion)}
            </Block>
          </BoxPanel>
        </Box>
        )}
      </>
    );
  }

  render() {
    const { error, isLoading, isFormValid } = this.state;

    if (isLoading) {
      return (
        <StyledEmployers>
          <CircularProgress />
        </StyledEmployers>
      );
    }
    return (
      <StyledEmployers>

        <StyleContainerBlock>
          {this.props.declarations && this.props.declarations.length && (
          <>
            <Box display="inline-flex">
              {this.renderEmployerPanel()}
              {this.renderCreatorPanel()}
            </Box>
          </>
          )}

          <StyledAlwaysVisibleContainer
            scrollButtonTopValue="0"
            style={{ marginTop: '2rem', alignSelf: 'stretch' }}
          >
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <ButtonsContainer>
              <StyledMainAction primary onClick={this.openDialog} disabled={!isFormValid}>
                Envoyer mon
                <br />
                actualisation
              </StyledMainAction>
              <StyledMainAction
                primary={false}
                onClick={this.saveAndRedirect}
                disabled={!isFormValid}
              >
                Enregistrer
                <br />
                et finir plus tard
              </StyledMainAction>
            </ButtonsContainer>
          </StyledAlwaysVisibleContainer>
        </StyleContainerBlock>

        <DeclarationDialogsHandler
          isLoading={this.state.isValidating}
          isOpened={this.state.isDialogOpened}
          onCancel={this.closeDialog}
          onConfirm={this.onSubmit}
          declaration={this.state.currentDeclaration}
          employers={this.state.employers}
          enterprises={this.state.enterprises}
          consistencyErrors={this.state.consistencyErrors}
          validationErrors={this.state.validationErrors}
        />
        <LoginAgainDialog isOpened={this.state.isLoggedOut} />
        <PreviousEmployersDialog
          isOpened={this.state.showPreviousEmployersModal}
          onCancel={this.closePreviousEmployersModal}
          employers={this.state.previousEmployers}
        />
      </StyledEmployers>
    );
  }
}

export default connect(
  (state) => ({
    declarations: state.declarationsReducer.declarations,
  }),
  {
    fetchDeclarations: fetchDeclarationsAction,
    postEmployers: postEmployersAction,
    setNoNeedEmployerOnBoarding: setNoNeedEmployerOnBoardingAction,
  },
)(withWidth()(Employers));
