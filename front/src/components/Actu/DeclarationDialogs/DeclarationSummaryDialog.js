import React from 'react';
import NumberFormat from 'react-number-format';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import { Typography } from '@material-ui/core';
import DialogContentText from '@material-ui/core/DialogContentText';

import MainActionButton from '../../Generic/MainActionButton';
import CustomDialog from '../../Generic/CustomDialog';

import {
  formattedDeclarationMonth,
  formatIntervalDates,
  formatDate,
} from '../../../lib/date';
import {
  ActuTypes as types, jobSearchEndMotive, TIMEWORKED, CREATORTAXRATE,
} from '../../../constants';
import { ucfirst } from '../../../utils/utils.tool';

const StyledDialogContentText = styled(DialogContentText)`
  && {
    border-bottom: solid 2px #f2f2f2;
    padding: 0 2rem 2rem;
    color: black;
  }
`;

const DeclarationContent = styled(DialogContentText).attrs({
  component: 'div',
})`
  && {
    margin: 0 64px;
    text-align: left;
    padding-bottom: 3rem;
  }
`;

const DeclarationHeader = styled.div`
  font-weight: bold;
  color: black;
  margin-top: 2rem;
  text-transform: uppercase;
`;

const DeclarationValues = styled(Typography).attrs({ color: 'secondary' })`
  && {
    font-size: 1.6rem;
  }
`;

const DeclarationUl = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;
  font-weight: bold;
`;

const DeclarationLi = styled(DeclarationValues).attrs({
  component: 'li',
})``;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-between;
  width: 100%;
  max-width: 40rem;
  padding: 0.5rem 0 1rem 0;
`;

const DeclarationSummaryDialog = ({
  declaration,
  employers = [],
  enterprises = [],
  onCancel,
  onConfirm,
  ...props
}) => {
  const sickLeaves = declaration.infos.filter(
    (info) => info.type === types.SICK_LEAVE,
  );
  const maternityLeave = declaration.infos.find(
    (info) => info.type === types.MATERNITY_LEAVE,
  );
  const interships = declaration.infos.filter(
    (info) => info.type === types.INTERNSHIP,
  );

  const jobSearch = declaration.infos.find(
    (info) => info.type === types.JOB_SEARCH,
  );

  const invalidity = declaration.infos.find(
    (info) => info.type === types.INVALIDITY,
  );
  const retirement = declaration.infos.find(
    (info) => info.type === types.RETIREMENT,
  );

  return (
    <CustomDialog
      fullWidth
      content={(
        <>
          <StyledDialogContentText>
            Votre actualisation
            {declaration.declarationMonth && (
              // FIXME this is a quickfix for the Actu page, but we should always have the month.
              <>
                {' '}
                de
                {' '}
                <b>
                  {ucfirst(formattedDeclarationMonth(
                    declaration.declarationMonth.month,
                  ))}
                </b>
                <br />
                est-elle exacte et complète ?
              </>
            )}
          </StyledDialogContentText>

          <DeclarationContent>
            {declaration.hasWorked && (
              <>
                {employers.length !== 0 && (
                  <div>
                    <DeclarationHeader>
                      {employers.length >= 2 ? 'employeurs' : 'employeur'}
                    </DeclarationHeader>
                    <DeclarationUl className="employer-declared-list">
                      {employers.map((employer, i) => {
                        const key = `${i}-${employer.employerName.value}`;
                        return (
                          <DeclarationLi key={key}>
                            {employer.employerName.value}
                            {' '}
                          -
                            {' '}
                            <NumberFormat
                              thousandSeparator=" "
                              decimalSeparator=","
                              decimalScale={0}
                              fixedDecimalScale
                              displayType="text"
                              suffix="€ HT"
                              value={employer.salary.value}
                            />
                          </DeclarationLi>
                        );
                      })}
                    </DeclarationUl>
                  </div>
                )}

                {enterprises.length !== 0 && (
                  <div>
                    <DeclarationHeader>
                      {enterprises.length >= 2 ? 'entreprises' : 'entreprise'}
                    </DeclarationHeader>
                    <DeclarationUl className="employer-declared-list">
                      {enterprises.map((enterprise, i) => {
                        const key = `${i}-${enterprise.workHoursCreator.value}`;

                        let leftPart = null;
                        let rightPart = null;

                        switch (enterprise.timeWorked.value) {
                          case TIMEWORKED.NO:
                            leftPart = "Je n'ai pas travaillé pour mon entreprise ce mois-ci";
                            break;
                          case TIMEWORKED.FULL:
                            leftPart = "J'ai travaillé à temps plein pour mon entreprise";
                            break;
                          default:
                            leftPart = (
                              <NumberFormat
                                decimalScale={0}
                                fixedDecimalScale
                                displayType="text"
                                suffix={enterprise.workHoursCreator.value > 1 ? ' heures' : ' heure'}
                                value={enterprise.workHoursCreator.value}
                              />
                            );
                            break;
                        }

                        if (declaration.taxeDue === CREATORTAXRATE.MONTHLY) {
                          rightPart = (
                            <>
                              Déclaration URSSAF tous les mois
                              {' '}
                            -
                            {' '}
                              <NumberFormat
                                thousandSeparator=" "
                                decimalSeparator=","
                                decimalScale={0}
                                fixedDecimalScale
                                displayType="text"
                                suffix="€"
                                value={enterprise.turnover.value}
                              />
                            </>
                          );
                        } else {
                          rightPart = <>
                            Déclaration URSSAF tous les trismestres
                          </>;
                        }

                        return (
                          <DeclarationLi key={key}>
                            {leftPart}
                            {leftPart && rightPart && (
                              <>
                                {' '}
                            -
                                {' '}
                              </>
                            )}
                            {rightPart}
                          </DeclarationLi>
                        );
                      })}
                    </DeclarationUl>
                  </div>
                )}
              </>
            )}

            {!declaration.hasWorked && (
              <div>
                <DeclarationHeader>Travail</DeclarationHeader>
                <DeclarationValues>
                  Vous n'avez pas travaillé.
                </DeclarationValues>
              </div>
            )}

            {declaration.hasInternship && (
              <div>
                <DeclarationHeader>
                  {interships.length}
                  {' '}
                  {interships.length >= 2 ? 'stages' : 'stage'}
                </DeclarationHeader>
                <DeclarationUl>
                  {interships.map((intership) => (
                    <DeclarationLi key={intership.startDate}>
                      {formatIntervalDates(
                        intership.startDate,
                        intership.endDate,
                      )}
                    </DeclarationLi>
                  ))}
                </DeclarationUl>
              </div>
            )}

            {declaration.hasSickLeave && (
              <div>
                <DeclarationHeader>
                  {sickLeaves.length}
                  {' '}
                  {sickLeaves.length >= 2 ? 'arrêts maladie' : 'arrêt maladie'}
                </DeclarationHeader>
                <DeclarationUl>
                  {sickLeaves.map((sickLeave) => (
                    <DeclarationLi key={sickLeave.startDate}>
                      {formatIntervalDates(
                        sickLeave.startDate,
                        sickLeave.endDate,
                      )}
                    </DeclarationLi>
                  ))}
                </DeclarationUl>
              </div>
            )}

            {declaration.hasMaternityLeave && (
              <div>
                <DeclarationHeader>Congé maternité</DeclarationHeader>
                <DeclarationValues>
                  Depuis le
                  {' '}
                  {formatDate(maternityLeave.startDate)}
                </DeclarationValues>
              </div>
            )}

            {declaration.hasInvalidity && (
              <div>
                <DeclarationHeader>Invalidité</DeclarationHeader>
                <DeclarationValues>
                  Depuis le
                  {' '}
                  {formatDate(invalidity.startDate)}
                </DeclarationValues>
              </div>
            )}

            {declaration.hasRetirement && (
              <div>
                <DeclarationHeader>Retraite</DeclarationHeader>
                <DeclarationValues>
                  Départ le
                  {' '}
                  {formatDate(retirement.startDate)}
                </DeclarationValues>
              </div>
            )}

            <div>
              <DeclarationHeader>Inscription</DeclarationHeader>
              {declaration.isLookingForJob ? (
                <DeclarationValues>
                  Oui, je souhaite rester inscrit.e à Pôle emploi
                </DeclarationValues>
              ) : (
                  <>
                    <DeclarationValues>
                      Non, je ne souhaite pas rester inscrit.e à Pôle emploi
                  </DeclarationValues>

                    {jobSearch && <DeclarationValues>
                      Date de fin :
                    {' '}
                      {formatDate(jobSearch.endDate)}
                    </DeclarationValues>}
                    <DeclarationValues>
                      Motif :
                    {' '}
                      {declaration.jobSearchStopMotive ===
                        jobSearchEndMotive.WORK && 'Reprise du travail'}
                      {declaration.jobSearchStopMotive ===
                        jobSearchEndMotive.RETIREMENT && 'Retraite'}
                      {declaration.jobSearchStopMotive ===
                        jobSearchEndMotive.OTHER && 'Autre'}
                    </DeclarationValues>
                  </>
                )}
            </div>
          </DeclarationContent>
        </>
      )}
      actions={(
        <ButtonsContainer>
          <MainActionButton
            variant="contained"
            onClick={onConfirm}
            primary
            autoFocus
          >
            Oui, je confirme
          </MainActionButton>
          <MainActionButton primary={false} onClick={onCancel}>
            Non, je modifie
          </MainActionButton>
        </ButtonsContainer>
      )}
      {...props}
    />
  );
};

DeclarationSummaryDialog.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  declaration: PropTypes.object.isRequired,
  employers: PropTypes.arrayOf(PropTypes.object),
  enterprises: PropTypes.arrayOf(PropTypes.object),
};

export default DeclarationSummaryDialog;
