import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { connect } from 'react-redux'
import withWidth from '@material-ui/core/withWidth'
import { Typography } from '@material-ui/core'
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';

import { fetchDeclarations as fetchDeclarationAction } from '../../redux/actions/declarations'
import ActuStatus from '../../components/Generic/actu/ActuStatus'
import { H4 } from '../../components/Generic/Titles'
import OnBoarding from './onBoarding/OnBoarding'
import DashboardJustificatifs from './DashboardJustificatifs'
import dashboardHelpImg from '../../images/dashboardHelp.svg'
import MainActionButton from '../../components/Generic/MainActionButton'

const StyledDashboard = styled.div`
  margin: ${({ width }) => {
    if (['xs', 'sm'].includes(width)) return '0rem 1rem !important'
    if (['md'].includes(width)) return '0rem 2rem !important'
    return '0rem 4rem !important'
  }};
`

const Title = styled(Typography).attrs({ variant: 'h3', component: 'h1' })`
  && {
    margin-bottom: 2rem;
    font-weight: bold;
    letter-spacing: 1px;
    text-align: left;
    margin-left: ${({ width }) =>
    ['xs', 'sm'].includes(width) ? '2rem' : null};
    margin-top: ${({ width }) =>
    ['xs', 'sm'].includes(width) ? '0rem' : '0rem'};
  }
`

const StatusContainer = styled.div``

class Dashboard extends PureComponent {
  componentDidMount() {
    this.props.fetchDeclarations()
  }

  render() {
    const { user, width, activeMonth, declarations, declaration } = this.props

    if (user.needOnBoarding) {
      // Show "thank you" to only relative new users
      return (
        <OnBoarding
          showEmail={!user.email}
          showThankYou={user.registeredAt > '2020-01-16'}
        />
      )
    }

    return (
      <StyledDashboard width={width}>
        <Grid container spacing={4}>
          <Grid item md={9} sm={12}>
            <Title>Bonjour {user.firstName}</Title>
            <StatusContainer>
              {!user.isBlocked && (
                <ActuStatus
                  activeMonth={activeMonth}
                  user={user}
                  declarations={declarations}
                  declaration={declaration}
                />
              )}
              <DashboardJustificatifs />
            </StatusContainer>
          </Grid>
          <Hidden only={['xs', 'sm']}>
            <Grid item xs={3}>
              <img src={dashboardHelpImg} style={{ width: '100%' }} alt="Besoin d'aide" />
              <H4>Besoin d'aide ?</H4>
              <Typography>
                Toutes nos réponses concernant l'actualisation sur Zen Pôle emploi.
              </Typography>
              <MainActionButton
                href="https://pole-emploi.zendesk.com/hc/fr"
                target="_blank"
                rel="noopener noreferrer"
                title="Contactez-nous"
                primary
                style={{ margin: '2rem 0rem', height: '5.5rem', textTransform: 'none' }}
              >
                Contactez-nous
              </MainActionButton>
            </Grid>
          </Hidden>
        </Grid>
      </StyledDashboard>
    )
  }
}

Dashboard.propTypes = {
  activeMonth: PropTypes.instanceOf(Date).isRequired,
  fetchDeclarations: PropTypes.func.isRequired,
  user: PropTypes.shape({
    firstName: PropTypes.string,
    hasAlreadySentDeclaration: PropTypes.bool,
    canSendDeclaration: PropTypes.bool,
    isBlocked: PropTypes.bool,
    email: PropTypes.string,
    needOnBoarding: PropTypes.bool,
    registeredAt: PropTypes.instanceOf(Date),
  }),
  declaration: PropTypes.object,
  declarations: PropTypes.arrayOf(PropTypes.object),
  width: PropTypes.string.isRequired,
}

export default connect(
  (state) => ({
    declarations: state.declarationsReducer.declarations,
    activeMonth: state.activeMonthReducer.activeMonth,
    user: state.userReducer.user,
    isFilesServiceUp: state.statusReducer.isFilesServiceUp,
  }),
  {
    fetchDeclarations: fetchDeclarationAction,
  },
)(withWidth()(Dashboard))