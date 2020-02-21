import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
} from 'react-router-dom';

import Sidebar from './components/base/sidebar';
import HeaderStatus from './components/base/header-status';
import wsConnector from './plugins/ws-connector';
import './App.less';



class App extends React.Component {
    render() {
        return (
            <Router>
                <div className="app">
                    <Sidebar />

                    <div className="app-container">
                        <HeaderStatus />
                        <Switch>
                            <Route exact path="/">
                                Index Page
                            </Route>
                            <Route path="/commands/start">
                                Command Start
                            </Route>
                        </Switch>
                    </div>
                </div>
            </Router>
        );
    }

    componentDidMount() {
        this.connector = wsConnector;
        wsConnector.connect();
    }
}

export default App;
