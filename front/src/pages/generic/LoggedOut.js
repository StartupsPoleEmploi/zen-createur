import Button from '@material-ui/core/Button';
import React from 'react';
import styled from 'styled-components';
import { DialogContentText } from '@material-ui/core';

const StyledDiv = styled.div`
  text-align: center;
`;

export const LoggedOut = () => (
  <StyledDiv>
    <DialogContentText>Vous avez été déconnecté</DialogContentText>
    <Button href="/" role="link" variant="contained">
      Retour à la page d'accueil
    </Button>
  </StyledDiv>
);

export default LoggedOut;
