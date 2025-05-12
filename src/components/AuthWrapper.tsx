// src/components/AuthWrapper.tsx

import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { ReactNode } from 'react';

interface AuthWrapperProps {
  children: (signOut: () => void) => ReactNode; 
  signOut?: () => void;
}

function AuthWrapper({ children, signOut }: AuthWrapperProps) {
  return <>{signOut && children(signOut)}</>;
}

export default withAuthenticator(AuthWrapper, {
  hideSignUp: true
});