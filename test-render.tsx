import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App';
import SecurityView from './src/components/SecurityView';

try {
  console.log("Rendering SecurityView...");
  renderToString(React.createElement(SecurityView, { language: 'vi' }));
  console.log("SecurityView ok");
  
  console.log("Rendering App...");
  renderToString(React.createElement(App));
  console.log("App ok");
} catch(e) {
  console.error("ERROR rendering:", e);
}
