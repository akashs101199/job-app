import baseFetch from './api';
import { ENDPOINTS } from '../config/api';

export const fetchMe = () =>
  baseFetch(ENDPOINTS.ME);

export const login = (email, password) =>
  baseFetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const register = (email, password, firstName, lastName, dob) =>
  baseFetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    body: JSON.stringify({ email, password, firstName, lastName, dob }),
  });

export const logout = () =>
  baseFetch(ENDPOINTS.LOGOUT, { method: 'POST' });
