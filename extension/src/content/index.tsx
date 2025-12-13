import React from 'react';
import ReactDOM from 'react-dom/client';
import FloatingInterface from '../components/FloatingInterface';
// import '../index.css'; // We will handle styles within Shadow DOM or import explicitly if needed

const rootId = 'interactgen-tour-root';

function inject() {
    if (document.getElementById(rootId)) return;

    const appContainer = document.createElement('div');
    appContainer.id = rootId;
    appContainer.style.position = 'absolute';
    appContainer.style.top = '0';
    appContainer.style.left = '0';
    appContainer.style.width = '100%';
    appContainer.style.height = '0'; // Don't block clicks initially
    appContainer.style.zIndex = '2147483647'; // Max z-index
    document.body.appendChild(appContainer);

    // Attach Shadow DOM to isolate styles
    const shadowRoot = appContainer.attachShadow({ mode: 'open' });

    // Inject Tailwind base styles? Or just scoped styles.
    // For MVP we might just use inline styles or fetch the CSS file URL.
    // With CRXJS we can import css files and it handles injection, 
    // but for Shadow DOM we usually need to construct a style tag.

    const rootDiv = document.createElement('div');
    shadowRoot.appendChild(rootDiv);

    const root = ReactDOM.createRoot(rootDiv);
    root.render(
        <React.StrictMode>
            <FloatingInterface />
        </React.StrictMode>
    );
}

inject();
