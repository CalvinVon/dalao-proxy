import React from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../../routes';

import Logo_H from '../../assets/ui_logo_light.png';
import Menu_history from '../../assets/menu-history.png';

import './sidebar.less';

class Sidebar extends React.Component {
    constructor() {
        super();
        this.state = {

        };
    }


    render() {
        return (
            <div className="sidebar">
                <div className="sidebar-header">
                    <img className="header-img" src={Logo_H} />
                </div>
                <div className="sidebar-menu">
                    <ul>
                        {
                            routes.map(route => {
                                return (
                                    <li key={route.path}>
                                        <Link to={route.path} className="menu-item">
                                            <img src={route.icon} alt={'menu-' + route.name} className="item-icon" />
                                            <span className="item-text">{route.name}</span>
                                        </Link>
                                    </li>
                                );
                            })
                        }
                    </ul>
                </div>
            </div>
        )
    }
}

export default Sidebar;
