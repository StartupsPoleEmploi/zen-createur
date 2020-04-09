import FormHelperText from '@material-ui/core/FormHelperText'
import FormLabel from '@material-ui/core/FormLabel'
import TextField from '@material-ui/core/TextField'
import Delete from '@material-ui/icons/DeleteOutlined'
import moment from 'moment'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import styled from 'styled-components'
import withWidth from '@material-ui/core/withWidth'
import ArrowDropDown from '@material-ui/icons/ArrowDropDown'


import { Box, Typography } from '@material-ui/core'
import red from '@material-ui/core/colors/red'
import EuroInput from '../Generic/EuroInput'
import HourInput from '../Generic/HourInput'
import YesNoRadioGroup from '../Generic/YesNoRadioGroup'
import TooltipOnFocus from '../Generic/TooltipOnFocus'
import warn from '../../images/warn.png'

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

const StyledFormLabel = styled(FormLabel)`
  margin-right: 1rem;
  && {
    color: #000;
  }
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


export class EmployerQuestion extends PureComponent {
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
      from: 'employers'
    })
  }

  onRemove = () => this.props.onRemove(this.props.index)

  renderLabel = ({ id, label, content }) => (
    <div>
      {label}
      <TooltipOnFocus tooltipId={id} content={content}>
        <InfoImg src={warn} alt="Informations" />
      </TooltipOnFocus>
    </div>
  )

  render() {
    const {
      employerName,
      index,
      workHours,
      salary,
      hasEndedThisMonth,
      verticalLayout,
      width,
      canRemove,
      defaultName,
      collapsed,
      showCollapsedTitle,
    } = this.props

    const hasFormError = workHours.error || employerName.error || salary.error;

    return (
      <StyledContainer className="employer-question">
        {showCollapsedTitle && <CollapsedTitle onClick={this.props.onCollapsed}>
          <Title variant="h6" component="h1">{employerName.value || defaultName} {hasFormError && <Asterisk>*</Asterisk>}</Title>
          <p>{collapsed ? 'AFFICHER' : 'MASQUER'}</p>
          <ArrowDropDown style={{ color: '#0065DB' }} />
          {canRemove && <RemoveButton
            onClick={event => { event.stopPropagation(); this.onRemove() }}
            type="button"
            aria-label="Supprimer"
          >
            <DeleteIcon />
          </RemoveButton>}
        </CollapsedTitle>}
        {!collapsed && <><StyledMain>
          <StyledTextField
            id={`employerName[${index}]`}
            className="root-employer"
            label={this.renderLabel({
              id: `employerName[${index}]`,
              label: 'Nom employeur',
              content:
                'Si vous avez plusieurs employeurs, cliquez sur "Ajouter un employeur"',
            })}
            name={`employerName[${index}]`}
            value={employerName.value}
            onChange={this.onChange}
            onBlur={this.onChange}
            error={!!employerName.error}
            helperText={employerName.error}
            inputProps={{
              'aria-describedby': `employerNameDescription[${index}]`,
            }}
            fullWidth={verticalLayout}
          />

          <Box display="flex">
            <Box flex={1}>
              <StyledTextField
                id={`workHours[${index}]`}
                className="root-work-hours"
                label={this.renderLabel({
                  id: `workHours[${index}]`,
                  label: "Nombre d'heures",
                  content:
                    'Inscrivez les heures qui sont inscrites sur votre fiche de paie.',
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
              />
            </Box>

            <Box flex={1} style={{ marginLeft: '20px' }}>
              <StyledTextField
                id={`salary[${index}]`}
                className="root-salary"
                label={this.renderLabel({
                  id: `salary[${index}]`,
                  label: 'Salaire € brut',
                  content: 'Déclarez le salaire brut pour cet employeur',
                })}
                name={`salary[${index}]`}
                value={salary.value}
                onChange={this.onChange}
                error={!!salary.error}
                helperText={salary.error}
                InputProps={{
                  inputComponent: EuroInput,
                }}
                // eslint-disable-next-line react/jsx-no-duplicate-props
                inputProps={{
                  maxLength: 10,
                  'aria-describedby': `salaryDescription[${index}]`,
                }}
                fullWidth={verticalLayout}
              />
            </Box>
          </Box>
          <Box display="flex">
            <Box flex={1}>
              <StyledFormLabel
                style={{ paddingTop: '1rem', paddingBottom: '1rem' }}
              >
                {width !== 'xs' ? (
                  <>
                    Contrat terminé en<br />
                    {moment(this.props.activeMonth).format('MMMM YYYY')}
                  &nbsp;?
                </>
                ) : (
                    <>
                      Terminé en {moment(this.props.activeMonth).format('MMMM')}
                  &nbsp;?
                </>
                  )}
                {hasEndedThisMonth.error && (
                  <FormHelperText error>{hasEndedThisMonth.error}</FormHelperText>
                )}
              </StyledFormLabel>
            </Box>
            <Box flex={1}>
              <YesNoRadioGroup
                yesTooltipContent={`Si votre employeur vous a payé des congés, n’oubliez pas
                    d’inclure cette somme dans le salaire brut déclaré`}
                name={`hasEndedThisMonth[${index}]`}
                value={hasEndedThisMonth.value}
                onAnswer={this.onChange}
              /></Box>
          </Box>
        </StyledMain></>}
      </StyledContainer>
    )
  }
}

EmployerQuestion.propTypes = {
  employerName: PropTypes.shape({
    value: PropTypes.string,
    error: PropTypes.string,
  }).isRequired,
  workHours: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    error: PropTypes.string,
  }).isRequired,
  salary: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    error: PropTypes.string,
  }).isRequired,
  hasEndedThisMonth: PropTypes.shape({
    value: PropTypes.bool,
    error: PropTypes.string,
  }),
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onCollapsed: PropTypes.func.isRequired,
  canRemove: PropTypes.bool.isRequired,
  activeMonth: PropTypes.instanceOf(Date).isRequired,
  verticalLayout: PropTypes.bool,
  width: PropTypes.string.isRequired,
  showCollapsedTitle: PropTypes.bool.isRequired,
  defaultName: PropTypes.string.isRequired,
  collapsed: PropTypes.bool.isRequired
}

export default withWidth()(EmployerQuestion)
