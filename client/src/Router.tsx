import React, { useContext } from 'react';
import { Switch, Route, Redirect, withRouter, RouteComponentProps } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { IntlContext } from './intl/IntlContext';
import { State } from './store';

import RouteWithLayout from './components/layout/wrappers/RouteWithLayout';

import MainLayout from './components/layout/MainLayout';
import LoginLayout from './components/layout/LoginLayout';

import Dashboard from './pages/Dashboard';
import ManageAccount from './pages/user/ManageAccount';
import PageNotFound from './pages/errors/PageNotFound';

interface Props extends RouteComponentProps<{ locale: string; }> {}

const Router: React.FC<Props> = (props) => {
  const {
    location: {
      pathname
    }
  } = props;

  const user = useSelector((state: State) => state.user);
  const { switchLocale, defaultLocale } = useContext(IntlContext);

  switchLocale(defaultLocale);

  if (!user.jwtValidated && !pathname.includes('/login')) {
    return <Redirect to={'/login'} />;
  }

  if (user.jwtValidated && pathname.includes('/login')) {
    return <Redirect to={'/'} />;
  }

  return (<Switch>
    <Route path={'/login'} component={LoginLayout} />

    <RouteWithLayout exact path={'/'} layout={MainLayout} component={Dashboard} />
    <RouteWithLayout path={'/account'} layout={MainLayout} component={ManageAccount} />

    <Route component={PageNotFound} />
  </Switch>);
}

export default withRouter(Router);