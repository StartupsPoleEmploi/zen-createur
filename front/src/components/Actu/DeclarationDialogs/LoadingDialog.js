import React from 'react';
import PropTypes from 'prop-types';

import CircularProgress from '@material-ui/core/CircularProgress';
import Done from '@material-ui/icons/Done';

import styled from 'styled-components';
import { Box } from '@material-ui/core';
import CustomDialog from '../../Generic/CustomDialog';

const Progress = styled(CircularProgress)`
  && {
    margin: 30px auto;
  }
`;

const DoneIcon = styled(Done)`
&& {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
`;

const BoxRelative = styled(Box)`
&& {
  position: relative;
}
`;

const success = '#bac778';

const LoadingDialog = ({ isSent, ...rest }) => (
  <CustomDialog
    content={(
      <>
        {isSent && (
          <BoxRelative>
            <Progress variant="static" value={100} style={{ color: success }} />
            <DoneIcon style={{ color: success }} />
          </BoxRelative>
        )}
        {!isSent && <Progress />}
      </>
    )}
    disableEscapeKeyDown
    disableBackdropClick
    {...rest}
  />
);

LoadingDialog.propTypes = {
  isSent: PropTypes.bool,
};

export default LoadingDialog;
