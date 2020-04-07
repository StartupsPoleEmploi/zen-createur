import TextField from '@material-ui/core/TextField'
import Delete from '@material-ui/icons/DeleteOutlined'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import styled from 'styled-components'
import withWidth from '@material-ui/core/withWidth'
import ArrowDropDown from '@material-ui/icons/ArrowDropDown'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Radio from '@material-ui/core/Radio'


import { Typography } from '@material-ui/core'
import red from '@material-ui/core/colors/red'
import EuroInputWithoutTaxe from '../Generic/EuroInputWithoutTaxe'
import HourInput from '../Generic/HourInput'
import TooltipOnFocus from '../Generic/TooltipOnFocus'
import warn from '../../images/warn.png'
import { mobileBreakpoint, MAXHOURCANWORK } from '../../constants'

const Title = styled(Typography)`
  && {
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 16px;
  }
`

const StyledContainer = styled.div`
  position: relative;
`

const Asterisk = styled.span`
  color: ${red[500]};
`

const StyledMain = styled.div`
  margin-bottom: 1.5rem;
  margin-top: 1rem;
`

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
`

const DeleteIcon = styled(Delete)`
  && {
    width: 2.5rem;
    height: 2.5rem;
  }
`

const StyledTextField = styled(TextField)`
  && {
    width: 100%;
    margin-bottom: 40px;
  }

  label > div {
    display: flex;
  }
`

const InfoImg = styled.img`
  width: 2rem;
  position: absolute;
  margin-left: 3px;
  cursor: pointer;
  z-index: 2;
`

const CollapsedTitle = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`

const QuestionLabel = styled(Typography)`
  && {
    flex-shrink: 1;

    @media (max-width: ${mobileBreakpoint}) {
      margin-bottom: 0.5rem;
    }
  }
  `


export class CreatorQuestion extends PureComponent {
  state = {
    timeWorked: null
  }

  onChange = ({ target: { name: fieldName, value: _value }, type }) => {
    let value = _value
    if (type === 'blur' && fieldName.startsWith('employerName')) {
      value = (_value || '').trim()
    }
    // The input 'name' attribute needs an array format
    // to avoid confusions (for example, browser autocompletions)
    // but the parent component here juste needs 'employerName'
    // for example.
    const name = fieldName.substr(0, fieldName.indexOf('['))
    this.props.onChange({
      name,
      value,
      index: this.props.index,
      from: 'enterprises'
    })
  }

  onRemove = () => this.props.onRemove(this.props.index)

  renderLabel = ({ id, label, content, showTooltip }) => (
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
    this.setState({ timeWorked: time });
    switch (time) {
      case "no":
        this.props.onChange({
          name: "workHours",
          value: 1,
          index: this.props.index,
          from: 'enterprises'
        })
        this.props.onChange({
          name: "turnover",
          value: 0,
          index: this.props.index,
          from: 'enterprises'
        })
        break;
      case "alf":
        this.props.onChange({
          name: "workHours",
          value: "",
          index: this.props.index,
          from: 'enterprises'
        })
        this.props.onChange({
          name: "turnover",
          value: 0,
          index: this.props.index,
          from: 'enterprises'
        })
        break;
      case "full":
        this.props.onChange({
          name: "workHours",
          value: MAXHOURCANWORK,
          index: this.props.index,
          from: 'enterprises'
        })
        break;
      default: break;
    }
  }

  render() {
    const {
      index,
      workHours,
      turnover,
      verticalLayout,
      canRemove,
      defaultName,
      collapsed,
      showCollapsedTitle,
    } = this.props

    const showTooltip = index === 0
    const hasFormError = workHours.error || turnover.error;

    return (
      <StyledContainer className="employer-question">
        {showCollapsedTitle && <CollapsedTitle onClick={this.props.onCollapsed}>
          <Title variant="h6" component="h1">{defaultName} {hasFormError && <Asterisk>*</Asterisk>}</Title>
          <p>{collapsed ? 'AFFICHER' : 'MASQUER'}</p>
          <ArrowDropDown style={{ color: '#0065DB' }} />
          {canRemove && <RemoveButton
            onClick={this.onRemove}
            type="button"
            aria-label="Supprimer"
          >
            <DeleteIcon />
          </RemoveButton>}
        </CollapsedTitle>}
        {!collapsed && <><StyledMain>
          <QuestionLabel>Avez-vous travaillé pour votre entreprise ?</QuestionLabel>
          <RadioGroup
            aria-label="Avez-vous travaillé pour votre entreprise ?"
            value={this.state.timeWorked}
            onChange={(val) => this.updateTimeworked(val.target.value)}
            style={{ marginBottom: '1.5rem' }}
          >
            <FormControlLabel
              value="no"
              control={<Radio color="primary" />}
              label="Non, pas ce mois-ci"
            />
            <FormControlLabel
              value="alf"
              control={<Radio color="primary" />}
              label="Oui, à temps partiel"
            />
            <FormControlLabel
              value="full"
              control={<Radio color="primary" />}
              label="Oui, à temps plein"
            />
          </RadioGroup>
          {this.state.timeWorked === "alf" &&
            <StyledTextField
              id={`creator-workHours[${index}]`}
              className="root-work-hours"
              label={this.renderLabel({
                id: `creator-workHours[${index}]`,
                label: "Estimation du nombre d'heures travaillées",
                content:
                  "Indiquez une estimation du nombre d'heures travaillés.",
                showTooltip,
              })}
              name={`workHours[${index}]`}
              value={workHours.value}
              onChange={this.onChange}
              error={!!workHours.error}
              helperText={workHours.error}
              InputProps={{
                inputComponent: HourInput,
              }}
              // eslint-disable-next-line react/jsx-no-duplicate-props
              inputProps={{
                maxLength: 4,
                'aria-describedby': `workHoursDescription[${index}]`,
              }}
              fullWidth={verticalLayout}
            />}

          <StyledTextField
            id={`creator-turnover[${index}]`}
            className="root-salary"
            label={this.renderLabel({
              id: `creator-turnover[${index}]`,
              label: "Montant chiffre d'affaire",
              content: "Déclarez votre chiffre d'affaire",
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
          />
        </StyledMain></>}
      </StyledContainer>
    )
  }
}

CreatorQuestion.propTypes = {
  workHours: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    error: PropTypes.string,
  }).isRequired,
  turnover: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    error: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onCollapsed: PropTypes.func.isRequired,
  canRemove: PropTypes.bool.isRequired,
  verticalLayout: PropTypes.bool,
  showCollapsedTitle: PropTypes.bool.isRequired,
  defaultName: PropTypes.string.isRequired,
  collapsed: PropTypes.bool.isRequired
}

export default withWidth()(CreatorQuestion)
