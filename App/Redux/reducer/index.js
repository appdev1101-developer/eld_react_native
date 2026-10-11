import { combineReducers } from "redux";
import User from './User';
import Dashboard from './Dashboard';
import Messages from './Messages';

export default combineReducers({
   User,
   Dashboard,
   Messages
})