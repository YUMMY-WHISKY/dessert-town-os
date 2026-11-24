import {createRoot} from 'react-dom/client';
import '@fontsource/fredoka';
import '@fontsource/jetbrains-mono';
import '@fontsource/noto-sans-sc';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
