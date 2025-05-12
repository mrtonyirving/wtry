// src/config/auth.ts

import { Amplify } from 'aws-amplify';

export const configureAmplify = (userPoolId: string, clientId: string) => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId: clientId,
      }
    }
  });
};