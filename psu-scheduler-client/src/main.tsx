import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Showcase from './pages/Showcase'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Showcase />
    </StrictMode>,
)
