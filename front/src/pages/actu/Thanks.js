import React, { Component } from 'react';

import PropTypes from 'prop-types';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';

import MainActionButton from '../../components/Generic/MainActionButton';
import sendDoc from '../../images/sendDoc.svg';
import { primaryBlue } from '../../constants';

const DECLARATION_FILE_URL = '/api/declarations/summary-file';

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
  padding: 4rem 0 6rem 0;
`;

const ButtonsContainers = styled.div`
  text-align: center;
`;

const Complementary = styled.div`
  margin-top: 5rem;
  padding: 3rem 1rem 2rem 1rem;
  border-top: 1px solid black;
`;

const FileLink = styled.a`
  font-size: 1.6rem;
  &:hover {
    text-decoration: underline;
    color: ${primaryBlue};
  }
`

export default class Thanks extends Component {
  constructor(props) {
    super(props);

    this.printIframe = React.createRef();
  }

  state = { showPrintIframe: false }

  printDeclaration = (e) => {
    e.preventDefault();

    if (this.state.showPrintIframe) {
      try {
        this.printIframe.current.contentWindow.print();
      } catch (err) {
        // Some browser, like firefox, can't print an iframe content, so we open a new tab for the PDF
        // For more information : https://bugzilla.mozilla.org/show_bug.cgi?id=874200
        window.open(DECLARATION_FILE_URL, '_blank');
      }
    } else this.setState({ showPrintIframe: true });
  }

  printIframeContent = (e) => {
    try {
      e.target.contentWindow.print();
    } catch (err) {
      // Some browser, like firefox, can't print an iframe content, so we open a new tab for the PDF
      // For more information : https://bugzilla.mozilla.org/show_bug.cgi?id=874200
      window.open(DECLARATION_FILE_URL, '_blank');
    }
  }

  render() {
    const { showPrintIframe } = this.state;

    return (
      <StyledThanks>
        <StyledImg src={sendDoc} alt="" />
        {!this.props.location.search.includes('later') ? (
          <>
            <Title variant="h6" style={{ paddingBottom: '3rem' }}>
              Merci, vos justificatifs ont été bien transmis
              <br />
              et seront traités dans les plus brefs délais.
            </Title>

            <Typography paragraph style={{ paddingBottom: '3rem' }}>
              Pas besoin d'envoyer vos justificatifs sur
              {' '}
              <br />
              <a href="https://www.pole-emploi.fr">pole-emploi.fr</a>
              ,
              {' '}
              <strong>Zen s'en charge pour vous !</strong>
            </Typography>

            <ButtonsContainers>
              <FileLink
                href="https://www.pole-emploi.fr/"
                target="_blank"
                title="PDF d'actualisation disponible uniquement sur Pôle emploi.fr"
              >
                PDF d'actualisation disponible uniquement sur Pôle emploi.fr
              </FileLink>
            </ButtonsContainers>

            <Complementary>
              <Typography paragraph>
                <strong>Un problème ? Une question ?</strong>
                <br />
                Vous pouvez joindre votre conseiller depuis votre espace
                personnel sur
                {' '}
                <a href="https://www.pole-emploi.fr">pole-emploi.fr</a>
                <br />
                ou
                {' '}
                <a
                  href="https://pole-emploi.zendesk.com/hc/fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="ouverture dans une nouvelle fenêtre"
                >
                  consulter notre FAQ
                </a>
              </Typography>
            </Complementary>

            {showPrintIframe && (
              <iframe
                src={DECLARATION_FILE_URL}
                title="Aucun contenu (dispositif technique)"
                style={{ display: 'none' }}
                ref={this.printIframe}
                id="declarationIframe"
                onLoad={this.printIframeContent}
              />
            )}
          </>
        ) : (
            <>
              <Title variant="h6">
                Merci, vos données ont bien été enregistrées.
            </Title>
              <Typography paragraph>
                Vous pourrez reprendre ultérieurement.
            </Typography>
              <ErrorOutlineIcon style={{ color: '#1F2C59', fontSize: 40, marginTop: '4rem' }} />
              <Typography paragraph style={{ fontSize: '1.7rem' }}>
                N’oubliez pas de revenir avant le 15 pour valider votre actualisation.
              <br />
              Un e-mail de rappel vous sera envoyé.
            </Typography>
            </>
          )}
      </StyledThanks>
    );
  }
}

Thanks.propTypes = {
  location: PropTypes.shape({ search: PropTypes.string.isRequired }).isRequired,
};
