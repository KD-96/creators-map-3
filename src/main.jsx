import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import Theme from './themes/Theme.jsx'

const allowedDomains = ["localhost", "creators-map-3.vercel.app"];
const allowedParentDomain = ["w3schools"]; // ** add allowed iframe domain
const currentDomain = window.location.hostname;

// ** Use this for block direct access
// if (window.top === window.self) {
//   document.body.innerHTML = "<h2>Direct access not allowed</h2>";
//   throw new Error("Blocked: Direct access");
// }

// ** Use this for block iframe from unknown domains
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
