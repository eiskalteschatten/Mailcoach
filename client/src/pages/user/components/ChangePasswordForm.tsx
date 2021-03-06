import React, { useContext } from 'react';
import { useDispatch } from 'react-redux';
import { Formik, Form, FormikProps } from 'formik';
import { FormattedMessage } from 'react-intl';
import * as Yup from 'yup';  // For some reason this still has to be done for yup

import {
  createStyles,
  makeStyles,
  Theme,
  Button
} from '@material-ui/core';

import { PasswordChange } from '../../../../../interfaces/auth/Users';

import { CurrentPassword, NewPassword, NewPasswordRepeat } from './ChangePasswordFormElements';

import { updateOwnPassword } from '../../../store/actions/userActions';
import { IntlContext } from '../../../intl/IntlContext';

interface FormValues extends PasswordChange {}

const initialValues: FormValues = {
  currentPassword: '',
  newPassword: ''
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      margin: 25
    },
    buttonWrapper: {
      textAlign: 'right'
    },
    button: {
      margin: '15px 0'
    }
  })
);

const ChangePasswordForm: React.FC = () => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const { messages } = useContext(IntlContext);

  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string()
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, messages.wrongPasswordFormat)
      .required(messages.required),
    newPassword: Yup.string()
      .required(messages.required),
    newPasswordRepeat: Yup.string()
      .oneOf([Yup.ref('newPassword')], messages.passwordsMustMatch)
      .required(messages.required)
  });

  return (<Formik
    initialValues={initialValues}
    onSubmit={async (values: FormValues, actions: any): Promise<void> => {
      await dispatch(updateOwnPassword(values));
      actions.setSubmitting(false);
    }}
    validationSchema={validationSchema}
  >
    {(formikProps: FormikProps<FormValues>) => (
      <Form className={classes.root}>
        <CurrentPassword />
        <NewPassword />
        <NewPasswordRepeat />

        <div className={classes.buttonWrapper}>
          <Button
            variant='contained'
            color='primary'
            className={classes.button}
            type='submit'
            disabled={formikProps.isSubmitting}
          >
            <FormattedMessage id='save' />
          </Button>
        </div>
      </Form>
  )}</Formik>);
}

export default ChangePasswordForm;

