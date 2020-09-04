import TextField from '@material-ui/core/TextField';
import Delete from '@material-ui/icons/DeleteOutlined';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import withWidth from '@material-ui/core/withWidth';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import ErrorOutline from '@material-ui/icons/ErrorOutline';


import { Typography, Box } from '@material-ui/core';
import red from '@material-ui/core/colors/red';
import EuroInputWithoutTaxe from '../Generic/EuroInputWithoutTaxe';
import HourInput from '../Generic/HourInput';
import TooltipOnFocus from '../Generic/TooltipOnFocus';
import warn from '../../images/warn.png';
import {
  mobileBreakpoint, MAXHOURCANWORK, helpColor, TIMEWORKED,
} from '../../constants';
import { MIN_WORK_HOURS } from '../../lib/salary';

const Title = styled(Typography)`
  && {
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 16px;
  }
`;

const DialogContentTextLabel = styled(Typography)`
  && {
    color: black;
  }
`;

const StyledContainer = styled.div`
  position: relative;
  margin-bottom: 14px;
`;

const Asterisk = styled.span`
  color: ${red[500]};
`;

const StyledMain = styled.div`
  margin-bottom: 1.5rem;
  margin-top: 1rem;
`;

const RemoveButton = styled.button`
  border: none;
  margin: 0;
  padding: 0;
  cursor: pointer;
  background: none;
  text-transform: uppercase;
  padding-left: 20px;
  position: absolute;
  left: 100%;
  top: 14px;
  opacity: 0.7;
  &::-moz-focus-inner {
    border: 0;
    padding: 0;
  }
`;

const DeleteIcon = styled(Delete)`
  && {
    width: 2.5rem;
    height: 2.5rem;
  }
`;

const StyledTextField = styled(TextField)`
  && {
    width: 100%;
    margin-bottom: 40px;
  }

  label > div {
    display: flex;
  }
`;

const ErrorOutlineImg = styled(ErrorOutline)`
  && {
    color: ${helpColor};
    vertical-align: sub;
    margin-left: 0.5rem;
  }
`;

const InfoImg = styled.img`
  width: 2rem;
  margin-left: 3px;
  cursor: pointer;
  z-index: 2;
`;

const CollapsedTitle = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.4s;
  &:hover {
    opacity: 0.6;
  }
`;

const QuestionLabel = styled(Typography)`
  && {
    flex-shrink: 1;
    margin-bottom: 16px;

    @media (max-width: ${mobileBreakpoint}) {
      margin-bottom: 0.5rem;
    }
  }
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


export class CreatorQuestion extends PureComponent {
  onChange = ({ target: { name: fieldName, value: _value }, type }) => {
    let value = _value;
    if (type === 'blur' && fieldName.startsWith('employerName')) {
      value = (_value || '').trim();
    }

    // The input 'name' attribute needs an array format
    // to avoid confusions (for example, browser autocompletions)
    // but the parent component here juste needs 'employerName'
    // for example.
    const name = fieldName.substr(0, fieldName.indexOf('[')) || fieldName;
    this.props.onChange({
      name,
      value,
      index: this.props.index,
      from: 'enterprises',
    });
  }

  onRemove = () => this.props.onRemove(this.props.index)

  renderLabel = ({
    id, label, content, showTooltip,
  }) => (
      <div>
        {label}
        {showTooltip && (
          <TooltipOnFocus tooltipId={id} content={content}>
            <InfoImg src={warn} alt="Informations" />
          </TooltipOnFocus>
        )}
      </div>
    )

  updateTimeworked = (time) => {
    switch (time) {
      case 'no':
        this.props.onChange({
          name: 'workHoursCreator',
          value: MIN_WORK_HOURS,
          index: this.props.index,
          from: 'enterprises',
        });
        this.props.onChange({
          name: 'turnover',
          value: 0,
          index: this.props.index,
          from: 'enterprises',
        });
        break;
      case 'alf':
        this.props.onChange({
          name: 'workHoursCreator',
          value: '',
          index: this.props.index,
          from: 'enterprises',
          ignoreError: true,
        });
        this.props.onChange({
          name: 'turnover',
          value: 0,
          index: this.props.index,
          from: 'enterprises',
        });
        break;
      case 'full':
        this.props.onChange({
          name: 'workHoursCreator',
          value: MAXHOURCANWORK,
          index: this.props.index,
          from: 'enterprises',
        });
        this.props.onChange({
          name: 'turnover',
          value: null,
          index: this.props.index,
          from: 'enterprises',
          ignoreError: true,
        });
        break;
      default: break;
    }

    this.props.onChange({
      name: 'timeWorked',
      value: time,
      index: this.props.index,
      from: 'enterprises',
    });
  }

  render() {
    const {
      index,
      workHoursCreator,
      timeWorked,
      turnover,
      verticalLayout,
      canRemove,
      defaultName,
      collapsed,
      showCollapsedTitle,
    } = this.props;

    const showTooltip = index === 0;
    const hasFormError = workHoursCreator.error || turnover.error;

    return (
      <StyledContainer className="employer-question">
        {showCollapsedTitle && (
          <CollapsedTitle onClick={this.props.onCollapsed}>
            <Title variant="h6" component="h1">
              {defaultName}
              {' '}
              {hasFormError && <Asterisk>*</Asterisk>}
            </Title>
            <DialogContentTextLabel>{collapsed ? 'AFFICHER' : 'MASQUER'}</DialogContentTextLabel>
            <ArrowDropDown style={{ color: '#0065DB' }} />
            {canRemove && (
              <RemoveButton
                onClick={this.onRemove}
                type="button"
                aria-label="Supprimer"
              >
                <DeleteIcon />
              </RemoveButton>
            )}
          </CollapsedTitle>
        )}
        {!collapsed && (
          <>
            <StyledMain>
              <QuestionLabel>Avez-vous travaillé pour votre entreprise ?</QuestionLabel>
              <RadioGroup
                aria-label="Avez-vous travaillé pour votre entreprise ?"
                value={timeWorked.value}
                name="timeWorked"
                onChange={(val) => this.updateTimeworked(val.target.value)}
                style={{ marginBottom: '1.5rem' }}
              >
                <Box display="flex" alignItems="center">
                  <Box flex={1}>
                    <FormControlLabel
                      value={TIMEWORKED.NO}
                      control={<Radio color="primary" />}
                      label="Non, pas ce mois-ci"
                    />
                  </Box>
                  <TooltipOnFocus content={<>Si vous déclarez <b>ne pas avoir travaillé</b> pour votre entreprise, <b>le nombre d'heure inscrit</b> sur votre déclaration d'actualisation Pôle emploi sera de <b>1 heure</b>. Si vous souhaitez arrêter l'activité de votre entreprise, vous devez le déclarer à Pôle emploi.</>}>
                    <ErrorOutlineImg />
                  </TooltipOnFocus>
                </Box>
                <Box display="flex" alignItems="center">
                  <Box flex={1}>
                    <FormControlLabel
                      value={TIMEWORKED.ALF}
                      control={<Radio color="primary" />}
                      label="Oui, à temps partiel"
                    />
                  </Box>
                  <TooltipOnFocus content={<>Temps partiel est la ligne à remplir si n'avez pas travaillé tout ce mois-ci pour votre entreprise. Quelques heures ou plusieurs jours dans le mois ? Pour exemple, 7h équivaut à une journée pleine.</>}>
                    <ErrorOutlineImg />
                  </TooltipOnFocus>
                </Box>
                <Box display="flex" alignItems="center">
                  <Box flex={1}>
                    <FormControlLabel
                      value={TIMEWORKED.FULL}
                      control={<Radio color="primary" />}
                      label="Oui, à temps plein"
                    />
                  </Box>
                  <TooltipOnFocus content={<>Si vous déclarez avoir travaillé pour votre entreprise à <b>temps plein</b> pour ce mois, le nombre d'heure inscrit sur votre déclaration d'actualisation Pôle emploi sera de <b>151 heures</b>.</>}>
                    <ErrorOutlineImg />
                  </TooltipOnFocus>
                </Box>
              </RadioGroup>
              {timeWorked && timeWorked.error && (
                <ErrorMessage>
                  {timeWorked.error}
                </ErrorMessage>
              )}
              {timeWorked.value === TIMEWORKED.ALF && (
                <StyledTextField
                  id={`creator-workHoursCreator[${index}]`}
                  className="root-work-hours"
                  label={this.renderLabel({
                    id: `creator-workHoursCreator[${index}]`,
                    label: "Estimation du nombre d'heures travaillées",
                    content:
                      "Indiquez une estimation du nombre d'heures travaillés.",
                  })}
                  name={`workHoursCreator[${index}]`}
                  value={workHoursCreator.value}
                  onChange={this.onChange}
                  error={!!workHoursCreator.error}
                  helperText={workHoursCreator.error}
                  InputProps={{
                    inputComponent: HourInput,
                    autoFocus: true,
                  }}
                  // eslint-disable-next-line react/jsx-no-duplicate-props
                  inputProps={{
                    maxLength: 4,
                    'aria-describedby': `workHoursCreatorDescription[${index}]`,
                  }}
                  fullWidth={verticalLayout}
                />
              )}

              {this.props.needTurnover && (
                <StyledTextField
                  id={`creator-turnover[${index}]`}
                  className="root-salary"
                  label={this.renderLabel({
                    id: `creator-turnover[${index}]`,
                    label: this.props.caText ? this.props.caText : "Montant chiffre d'affaire",
                    content: this.props.caHelper ? this.props.caHelper : <>Vous devez renseigner un chiffre d'affaire en <b>€ TTC avant abattement, mis à jour</b> avec le ou les montants facturés ce mois-ci.</>,
                    showTooltip,
                  })}
                  name={`turnover[${index}]`}
                  value={turnover.value}
                  onChange={this.onChange}
                  error={!!turnover.error}
                  helperText={turnover.error}
                  InputProps={{
                    inputComponent: EuroInputWithoutTaxe,
                  }}
                  // eslint-disable-next-line react/jsx-no-duplicate-props
                  inputProps={{
                    maxLength: 10,
                    'aria-describedby': `salaryDescription[${index}]`,
                  }}
                  fullWidth={verticalLayout}
                  inputRef={this.turnoverInput}
                />
              )}
            </StyledMain>
          </>
        )
        }
      </StyledContainer>
    );
  }
}

CreatorQuestion.propTypes = {
  workHoursCreator: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    error: PropTypes.string,
  }).isRequired,
  turnover: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    error: PropTypes.string,
  }).isRequired,
  timeWorked: PropTypes.shape({
    value: PropTypes.string,
    error: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func,
  onCollapsed: PropTypes.func,
  canRemove: PropTypes.bool.isRequired,
  verticalLayout: PropTypes.bool,
  needTurnover: PropTypes.bool.isRequired,
  showCollapsedTitle: PropTypes.bool.isRequired,
  defaultName: PropTypes.string.isRequired,
  collapsed: PropTypes.bool.isRequired,
  caText: PropTypes.string,
  caHelper: PropTypes.object,
};

export default withWidth()(CreatorQuestion);
