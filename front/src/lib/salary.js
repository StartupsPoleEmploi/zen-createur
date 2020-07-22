import { isObject } from 'lodash';
import { CREATORTAXRATE } from '../constants';

export const WORK_HOURS = 'workHours';
export const SALARY = 'salary';
export const TURNOVER = 'turnover';
export const WORK_HOURS_CREATOR = 'workHoursCreator';
export const MIN_SALARY = 1;
export const MIN_WORK_HOURS = 1;
export const MIN_WORK_HOURS_CREATOR = 0;
export const MIN_TURNOVER = 0;
export const MAX_SALARY = 99999;
export const MAX_WORK_HOURS = 1000000; // Arbitrary high value so users aren't limited
export const MAX_WORK_HOURS_CREATOR = 1000000;
export const MAX_TURNOVER = 1000000;

export const calculateTotal = (employers, field, lowLimit, highLimit) => {
  const total = employers.reduce((prev, employer) => {
    const number = parseFloat(
      isObject(employer[field]) ? employer[field].value : employer[field],
    );
    if (number < lowLimit || number > highLimit) return NaN;

    return number + prev;
  }, 0);

  if (total < lowLimit || total > highLimit) return NaN;

  return Math.round(total, 10);
};

export const needTurnover = (declaration) => {
  return declaration.status === 'sarl' || (declaration.taxeDue === CREATORTAXRATE.MONTHLY && declaration.status === 'autoEntreprise');
}