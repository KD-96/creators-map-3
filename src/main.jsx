import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import Theme from './themes/Theme.jsx'

const allowedDomains = ["localhost", "iframetester.com"];
const allowedParentDomain = ["iframetester.com"];
const currentDomain = window.location.hostname;

// if (window.top === window.self) {
//   document.body.innerHTML = "<h2>Direct access not allowed</h2>";
//   throw new Error("Blocked: Direct access");
// }

// // Block iframe from unknown domains
// const referrer = document.referrer;
// if (!referrer.includes(allowedParentDomain)) {
//   document.body.innerHTML = "<h2>Unauthorized embedding</h2>";
//   throw new Error("Blocked: Unauthorized embedding");
// }

if (!allowedDomains.some(domain => currentDomain.includes(domain))) {
  document.body.innerHTML = "<h2>Access denied</h2>";
  throw new Error("Unauthorized domain");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={Theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
