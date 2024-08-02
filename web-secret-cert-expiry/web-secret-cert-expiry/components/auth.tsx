// Description: This file contains the configuration for the Azure AD login.
import { useState } from 'react';
const [isAuth, setIsAuth] = useState(false);
const LoginConfig = {

  clientId: 'f9e82653-339f-4a2f-a011-02ec5cfebb4f',
  authority: 'https://login.microsoftonline.com/3a3920a2-b596-4e4e-95fc-7f438f7f3b14/',
  redirectUri: 'http://localhost:3000',
};


export default LoginConfig;