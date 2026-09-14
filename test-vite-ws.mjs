import { WebSocket } from 'ws';

const ws = new WebSocket('ws://127.0.0.1:3000/', 'vite-hmr');

ws.on('open', () => {
  console.log('Connected to Vite HMR websocket');
});

ws.on('message', (data) => {
  const payload = JSON.parse(data.toString());
  if (payload.type === 'error') {
    console.error('VITE ERROR:', payload.err);
  } else {
    console.log('Vite message:', payload.type);
  }
});

ws.on('error', (err) => {
  console.error('WS Error:', err);
});

setTimeout(() => {
  console.log("Exiting after 5 seconds");
  process.exit(0);
}, 5000);
