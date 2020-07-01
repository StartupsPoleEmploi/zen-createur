import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import styled from 'styled-components'
import { Typography, Grid, Hidden } from '@material-ui/core'
import DoneIcon from '@material-ui/icons/Done'
import withWidth from '@material-ui/core/withWidth'
import _ from 'lodash'

import { primaryBlue } from '../../../constants'
import { ActuStatusBlock, ActuHr } from './ActuGenericComponent'

const FileLink = styled.a`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: black;
  &:hover {
    text-decoration: underline;
    color: ${primaryBlue};
  }
`
const Hr = styled.div`
  width: 0.3rem;
  height: 100%; 
  background-color: #ffffff;
  margin: ${({ width }) => {
    if (['xs', 'sm', 'md'].includes(width)) return '0 2rem;'
    return '0 4rem;'
  }};
`

const DeclarationFinished = ({ declaration, width }) => {
  return (
    <>
      <Grid container spacing={2}>
        <Grid item sm={12} md={6}>
          <ActuStatusBlock title="Actualisation envoyée" Icon={<DoneIcon style={{ color: "green" }} />}>
            <Typography>
              Envoyée le {moment(declaration.transmitedAt).format('DD/MM/YYYY à HH:mm')}
            </Typography>
          </ActuStatusBlock>
        </Grid>
        <Grid item sm={12} md={6}>
          <Typography style={{ padding: '0 0 1rem 0' }}>
            <FileLink
              href="https://www.pole-emploi.fr/"
              target="_blank"
              title="PDF d'actualisation disponible uniquement sur Pôle emploi.fr"
            >
              PDF d'actualisation disponible uniquement sur Pôle emploi.fr
            </FileLink>
          </Typography>
        </Grid>
      </Grid>
      {declaration.employers.length !== 0 && (<><ActuHr /><div style={{ margin: '2rem auto 2rem auto' }}>
        <Grid container >
          <Grid item xs={10} sm={10} md={3} lg={3}>
            <Typography>Employeur{declaration.employers.length > 1 && <>s</>}</Typography>
            <Typography variant="h2" style={{ lineHeight: '1' }}>
              {declaration.employers.length}
            </Typography>
          </Grid>
          <Hidden smDown>
            <Grid item ><Hr width={width} /></Grid>
          </Hidden>
          <Grid item xs={10} sm={10} md={3} lg={3}>
            <Typography>Nombre d'heures</Typography>
            <Typography variant="h2" style={{ lineHeight: '1' }}>
              {Math.round(_.sumBy(declaration.employers, 'workHours'))} h
          </Typography>
          </Grid>
          <Hidden smDown>
            <Grid item ><Hr width={width} /></Grid>
          </Hidden>
          <Grid item xs={10} sm={10} md={3} lg={3}>
            <Typography>Salaire € brut</Typography>
            <Typography variant="h2" style={{ lineHeight: '1' }}>
              {Math.round(_.sumBy(declaration.employers, 'salary'))} €
            </Typography>
          </Grid>
        </Grid>
      </div></>)}
      {declaration.revenues.length !== 0 && (<><ActuHr /><div style={{ margin: '2rem auto 2rem auto' }}><Grid container >
        <Grid item xs={10} sm={10} md={3} lg={3}>
          <Typography>Entreprise{declaration.revenues.length > 1 && <>s</>}</Typography>
          <Typography variant="h2" style={{ lineHeight: '1' }}>
            {declaration.revenues.length}
          </Typography>
        </Grid>
        <Hidden smDown>
          <Grid item ><Hr width={width} /></Grid>
        </Hidden>
        <Grid item xs={10} sm={10} md={3} lg={3}>
          <Typography>Nombre d'heures</Typography>
          <Typography variant="h2" style={{ lineHeight: '1' }}>
            {Math.round(_.sumBy(declaration.revenues, 'workHours'))} h
          </Typography>
        </Grid>
        <Hidden smDown>
          <Grid item ><Hr width={width} /></Grid>
        </Hidden>
        <Grid item xs={10} sm={10} md={3} lg={3}>
          <Typography>Montant chiffre d'affaire</Typography>
          <Typography variant="h2" style={{ lineHeight: '1' }}>
            {Math.round(_.sumBy(declaration.revenues, 'turnover'))} €
          </Typography>
        </Grid>
      </Grid></div></>)}
    </>
  )
}

DeclarationFinished.propTypes = {
  declaration: PropTypes.object.isRequired,
  width: PropTypes.string.isRequired,
}

export default withWidth()(DeclarationFinished)