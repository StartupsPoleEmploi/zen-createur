import React, { Component } from 'react';

import PropTypes from 'prop-types';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';

import MainActionButton from '../../components/Generic/MainActionButton';
import thankImg from '../../images/thank.svg';
import { primaryBlue } from '../../constants';
import { Box } from '@material-ui/core';
import ArrowRightAlt from '@material-ui/icons/ArrowRightAlt';
import Check from '@material-ui/icons/Check';
import { connect } from 'react-redux';

const DECLARATION_FILE_URL = '/api/declarations/summary-file';

const Btn = styled(MainActionButton)`
white-space: nowrap;
width: auto !important;
padding: 0 4rem !important;
`

const Text = styled(Typography)`
font-size: 18px;
`

const CheckIcon = styled(Check)`
  && {
    margin-right: 1rem;
    color: green;
    vertical-align: sub;
  }
`;

const StyledArrowRightAlt = styled(ArrowRightAlt)`
  margin-left: 1rem;
`;

const StyledThanks = styled.div`
  margin: auto;
  text-align: center;
  width: 100%;
  max-width: 62rem;
`;

const StyledImg = styled.img`
  max-width: 30rem;
  width: 80%;
`;

const Title = styled(Typography).attrs({ component: 'h1' })`
  padding: 0 0 0.5rem 0;
  font-size: 22px !important;
`;

const ButtonsContainers = styled.div`
  text-align: center;
`;

class Thanks extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showSurvey: false
    }
  }

  componentDidMount = () => {
    const lastResponse = localStorage.getItem(`survey-response-${this.props.user.id}`);
    const now = new Date();

    const showSurvey = lastResponse === null || new Date(lastResponse).getMonth() != now.getMonth();
    this.setState({ showSurvey })
  }

  onMemorizeAction = () => {
    localStorage.setItem(`survey-response-${this.props.user.id}`, new Date());
    this.setState({ showSurvey: false })
  }

  render = () => {
    const later = this.props.location.search.includes('later');

    return (
      <StyledThanks>
        {later ? <>
          <Title variant="h4">
            Merci, vos données ont bien été enregistrées.
            </Title>
          <Text paragraph>
            Vous pourrez reprendre ultérieurement.
            </Text>
        </> : <>
            <Title variant="h4">
              Félicitations, votre dossier est à jour.
            </Title>
            <Text paragraph>
              Soyez Zen, aucun justificatif à transmettre
            </Text>
          </>}
''
        <StyledImg src={thankImg} alt="" />

        {!later ? (
          <>
            {this.state.showSurvey ? <><Title variant="h4" style={{ marginTop: '4rem' }}>
              Quelques minutes devant vous ?
            </Title>
              <Text paragraph>
                Aidez-nous à améliorer Zen en donnant votre avis
            </Text>
              <a href="https://surveys.hotjar.com/s?siteId=929102&surveyId=136440" rel="noopener noreferrer" target="_blank" style={{ textDecoration: 'none' }} onClick={this.onMemorizeAction}><Btn color="primary" primary>
                Je donne mon avis
              <StyledArrowRightAlt />
              </Btn></a></> : <>
                <Title variant="h4" style={{ marginTop: '4rem' }}>
                  <CheckIcon /> Merci, vous avez particié ce mois-ci
            </Title>
                <Text paragraph>
                  Rendez-vous le mois prochain pour nous aider à améliorer Zen
            </Text>
                <Btn color="primary" primary disabled>
                  Je donne mon avis
              <StyledArrowRightAlt />
                </Btn>
              </>}
          </>
        ) : (
            <>
              <Box><ErrorOutlineIcon style={{ color: '#1F2C59', fontSize: 40, marginTop: '4rem' }} /></Box>
              <Text paragraph style={{ fontSize: '1.7rem' }}>
                N’oubliez pas de revenir avant le 15 pour valider votre actualisation.
              <br />
              Un e-mail de rappel vous sera envoyé.
            </Text>
            </>
          )}
      </StyledThanks>
    );
  }
}

Thanks.propTypes = {
  location: PropTypes.shape({ search: PropTypes.string.isRequired }).isRequired,
  user: PropTypes.object.isRequired,
  showSurvey: PropTypes.bool.isRequired
};

export default connect(
  (state) => ({
    user: state.userReducer.user,
  }),
  {
  },
)(Thanks);