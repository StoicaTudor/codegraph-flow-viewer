import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './styles.css'
import {App} from "./app.js";

const container = document.getElementById('app')
if (!container) throw new Error('Root element #app was not found.')

const root = createRoot(container)
const app = <App/>

root.render(
    import.meta.env.VITE_ENABLE_STRICT_MODE === 'true'
        ? <StrictMode>{app}</StrictMode>
        : app
)
