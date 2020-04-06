import TextField from '@material-ui/core/TextField'
import Delete from '@material-ui/icons/DeleteOutlined'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import styled from 'styled-components'
import withWidth from '@material-ui/core/withWidth'
import ArrowDropDown from '@material-ui/icons/ArrowDropDown'


import { Box, Typography } from '@material-ui/core'
import red from '@material-ui/core/colors/red'
import EuroInput from '../Generic/EuroInput'
import HourInput from '../Generic/HourInput'
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


export class CreatorQuestion extends PureComponent {
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
          <Box display="flex">
            <Box flex={1}>
              <StyledTextField
                id={`workHours[${index}]`}
                className="root-work-hours"
                label={this.renderLabel({
                  id: `workHours[${index}]`,
                  label: "Nombre d'heures",
                  content:
                    'Indiquez les heures qui seront inscrites sur votre fiche de paie',
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
              />
            </Box>

            <Box flex={1} style={{ marginLeft: '20px' }}>
              <StyledTextField
                id={`turnover[${index}]`}
                className="root-salary"
                label={this.renderLabel({
                  id: `turnover[${index}]`,
                  label: "Montant chiffre d'affaire",
                  content: 'Déclarez le salaire brut pour cet employeur',
                  showTooltip,
                })}
                name={`turnover[${index}]`}
                value={turnover.value}
                onChange={this.onChange}
                error={!!turnover.error}
                helperText={turnover.error}
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
