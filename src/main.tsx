// src/main.tsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { configureAmplify } from './config/auth'

configureAmplify(
  'eu-north-1_s3FyPVsI4',        // USER_POOL_ID from CDK output
  '33hausg2o4i5makvprge2nh6vi', // USER_POOL_CLIENT_ID from CDK output
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)