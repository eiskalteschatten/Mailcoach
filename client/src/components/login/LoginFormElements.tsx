import React, { useContext } from 'react';
import { Field } from 'formik';
import { fieldToTextField } from 'formik-material-ui';

import {
  createStyles,
  makeStyles,
  Theme,
  TextField
} from '@material-ui/core';

import { IntlContext } from '../../intl/IntlContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    field: {
      margin: '15px 0'
    },
    input: {
      width: 500,
      display: 'block'
    }
  })
);

const LoginTextField: React.FC<any> = (props) => {
  const classes = useStyles();
  const formikExtension = (props.form && props.field)
    ? fieldToTextField(props)
    : {}

  return (<TextField
    {...formikExtension}
    {...props}
    fullWidth
    className={classes.field}
    InputProps={{
      inputProps: {
        className: classes.input
      }
    }}
  />);
};

export const Username = () => {
  const { messages } = useContext(IntlContext);

  return (<Field
    component={LoginTextField}
    name='username'
    label={messages.username}
  />);
}

export const Password = () => {
  const { messages } = useContext(IntlContext);

  return (<Field
    component={LoginTextField}
    name='password'
    type='password'
    label={messages.password}
  />);
}
