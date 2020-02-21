import React from 'react';
import { withMatchedRoute } from '../../routes';

import './header-status.less';


class HeaderStatus extends React.Component {
    render() {
        console.log(this);
        return (
             <div className="header-status">
                 <h3>{}</h3>
             </div>
        );
    }
}

export default withMatchedRoute(HeaderStatus);
