import React, { Component } from 'react';
import { isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import LoadingDialog from './LoadingDialog';
import ErrorsDialog from './ErrorsDialog';
import ConsistencyErrorsDialogs from './ConsistencyErrorsDialog';
import DeclarationSummaryDialog from './DeclarationSummaryDialog';
import * as Sentry from '@sentry/browser';

class DeclarationDialogsHandler extends Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    isOpened: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    consistencyErrors: PropTypes.arrayOf(PropTypes.string).isRequired,
    validationErrors: PropTypes.arrayOf(PropTypes.string).isRequired,
    declaration: PropTypes.object,
    employers: PropTypes.arrayOf(PropTypes.object),
    enterprises: PropTypes.arrayOf(PropTypes.object),
  }

  confirmAndIgnoreErrors = () => this.props.onConfirm({ ignoreErrors: true })

  render() {
    const {
      isLoading,
      isOpened,
      consistencyErrors,
      validationErrors,
      onCancel,
      declaration,
      employers,
      enterprises,
    } = this.props;

    const defaultProps = {
      title: "Confirmation de l'actualisation",
      titleId: 'ActuDialogContentText',
      isOpened,
      onCancel,
    };

    const defaultLoadingProps = {
      ...defaultProps,
      title: 'Traitement en cours',
    };

    if (isLoading) {
      return <LoadingDialog {...defaultLoadingProps} />;
    }

    if (validationErrors.length > 0) {
      return (
        <ErrorsDialog validationErrors={validationErrors} {...defaultProps} />
      );
    }

    if (consistencyErrors.length > 0) {
      return (
        <ConsistencyErrorsDialogs
          consistencyErrors={consistencyErrors}
          confirmAndIgnoreErrors={this.confirmAndIgnoreErrors}
          {...defaultProps}
        />
      );
    }

    if (!isEmpty(declaration)) {
      return (
        <DeclarationSummaryDialog
          declaration={declaration}
          employers={employers}
          enterprises={enterprises}
          onConfirm={this.props.onConfirm}
          {...defaultProps}
        />
      );
    }

    // FIXME This change is done quickly by fear that this could cause errors that
    // bubble up to the top of the app and crash everything.
    // If nothing alarming appears in the monitoring, this should be changed to simply
    // throw the error.
    if (!this.hasSentError) {
      Sentry.captureException(
        new Error(
          'DeclarationDialogsHandler is unable to create modal, this should never happen',
        ),
      );
      this.hasSentError = true;
    }

    return null;
  }
}

export default DeclarationDialogsHandler;
