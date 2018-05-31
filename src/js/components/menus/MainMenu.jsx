import React from 'react';
import PropTypes from 'prop-types';
import {withRouter} from 'react-router-dom';
import { MenuItem } from '../../utils/bc-components/index';
import * as UserActions from '../../actions/UserActions';
import UserStore from '../../stores/UserStore';

class MainMenu extends React.Component{
    
    constructor(){
        super();
        this.state = {
            session: UserStore.getSession()
        };
    }
    
    componentWillMount(){
        this.setState({
            session: UserStore.getSession()
        });
    }
    
    render(){
        if(!this.state.session.user) return (
            <ul className="nav flex-column">
                <MenuItem icon="fas fa-tachometer-alt" label="Log In" slug="login" to="/login" />
            </ul>
        );
        
        const role = this.state.session.user.type;
        return(
            <ul className="nav flex-column">
                <MenuItem icon="fas fa-tachometer-alt" label="Dashboard" slug="dashboard" to="/dashboard" />
                <MenuItem icon="fas fa-users" label="My Cohorts" slug="user" to="/manage/user/" />
                <MenuItem icon="fas fa-sign-out-alt" label="Close Session" slug="close_session"
                    onClick={() => UserActions.logoutUser()}
                />
            </ul>
        );
    }
}
MainMenu.propTypes = {
  // You can declare that a prop is a specific JS primitive. By default, these
  // are all optional.
  onClick: PropTypes.func,
  mobile: PropTypes.bool
};
MainMenu.defaultProps = {
  mobile: false
};
export default withRouter(MainMenu);