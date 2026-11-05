import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// CSS chung nạp trước để CSS riêng của từng component (nạp khi import App) được ưu tiên khi trùng.
import './styles/app.css';
import './styles/records.css';
import './styles/admin.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
