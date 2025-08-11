import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

if (typeof window !== 'undefined' && window.location.hostname === 'zamarsongs.com') {
  window.location.replace(`https://www.zamarsongs.com${window.location.pathname}${window.location.search}${window.location.hash}`);
}

createRoot(document.getElementById("root")!).render(<App />);
