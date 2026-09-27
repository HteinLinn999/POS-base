import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import './index.css'
import App from './App.tsx'

const theme = createTheme({

  primaryColor: 'cyan',
});
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" zIndex={1000} />
      <App />
    </MantineProvider>
  </StrictMode>,
)
