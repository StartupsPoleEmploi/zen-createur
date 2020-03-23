import React from 'react'
import PropTypes from 'prop-types'
import Typography from '@material-ui/core/Typography'
import styled from 'styled-components'
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied'

const StyledNotAutorized = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  max-width: 50rem;
`

const LandingText = styled(Typography).attrs({
  variant: 'h6',
  paragraph: true,
})``

export default function NotAutorized({ showIcon = true }) {
  return (
    <StyledNotAutorized>
      {showIcon && (
        <SentimentVeryDissatisfiedIcon
          style={{ fontSize: 84 }}
          color="secondary"
        />
      )}
      <LandingText component="h1" style={{ marginBottom: '5rem' }}>
        Malheureusement, le service n'est pas encore ouvert au grand public.
      </LandingText>
    </StyledNotAutorized>
  )
}

NotAutorized.propTypes = {
  showIcon: PropTypes.bool,
}
