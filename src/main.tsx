import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Host redirect disabled to allow both apex and www during DNS/SSL propagation

createRoot(document.getElementById("root")!).render(<App />);
