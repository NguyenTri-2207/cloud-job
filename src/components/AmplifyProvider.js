'use client';

import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      loginWith: {
        email: true,
        username: false,
        phone: false,
      },
      oauth: {
        domain: process.env.NEXT_PUBLIC_AWS_COGNITO_DOMAIN || '',
        scopes: ['email', 'openid', 'profile'],
        redirectSignIn: [
          process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || 'http://localhost:3000/',
        ],
        redirectSignOut: [
          process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || 'http://localhost:3000/',
        ],
        responseType: 'code',
      },
    },
  },
};

export default function AmplifyProvider({ children }) {
  useEffect(() => {
    Amplify.configure(amplifyConfig);
  }, []);

  return <>{children}</>;
}

