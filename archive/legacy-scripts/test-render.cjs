import Module from 'module';
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request.endsWith('.css')) return {};
  return originalRequire.apply(this, arguments);
};

import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App.tsx';

try {
  console.log("Rendering App...");
  renderToString(React.createElement(App));
  console.log("App ok");
} catch(e) {
  console.error("ERROR rendering App:", e);
}
