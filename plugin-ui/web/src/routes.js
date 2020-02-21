import React from 'react';
import { useRouteMatch, withRouter } from 'react-router-dom';

import icon_dashboard from './assets/menu-dashboard.png';
import icon_console from './assets/menu-console.png';
import icon_plugin from './assets/menu-plugin.png';
import icon_setting from './assets/menu-setting.png';

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: null,
        icon: icon_dashboard
    },
    {
        path: '/commands',
        name: 'Commands',
        component: null,
        icon: icon_console
    },
    {
        path: '/plugins',
        name: 'Plugins',
        component: null,
        icon: icon_plugin
    },
    {
        path: '/configuration',
        name: 'Configuration',
        component: null,
        icon: icon_setting
    }
];

function withMatchedRoute(WrapperComponent) {
    function C(props) {
        const matched = useRouteMatch();
        const matchedRoutes = routes.filter(route => route.path === matched.path);
        const route = matchedRoutes && matchedRoutes[0];
        return (
            <WrapperComponent {...props} route={route} />
        );
    };
    C.displayName = 'withMatchedRoute';
    return withRouter(C);
}

export {
    routes,
    withMatchedRoute
};
