
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Adicionar favicon
const link = document.createElement('link');
link.rel = 'icon';
link.href = '/lovable-uploads/376f74c3-969d-43de-915b-cb2b00c7e6df.png';
link.type = 'image/png';
document.head.appendChild(link);

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
