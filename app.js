import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import storage from 'node-persist';

const MAX_CLICKS_PER_SECOND = 12;
let broadcastInterval;

// Initialize node-persist
await storage.init();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

let clickCount = 0;

// Read the click count from the storage when the server starts
async function initializeClickCount() {
  const clickData = await storage.getItem('clickCount');
  if (clickData !== undefined) {
    clickCount = clickData;
  } else {
    // Initialize the click count in the storage if it doesn't exist
    await storage.setItem('clickCount', 0);
  }
}

const connectedRayIDs = new Set();

initializeClickCount().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Serve static files from the 'web' directory
app.use(express.static('./web'));

// WebSocket connection
wss.on('connection', (ws, request) => {
  const rayID = request.headers['cf-ray'];

  if (connectedRayIDs.has(rayID)) {
    ws.send(JSON.stringify({ blocked: true }));
    ws.close(1008, 'Too many connections from the same IP address');
    return;
  }

  connectedRayIDs.add(rayID);

  ws.clickCounter = 0;
  ws.lastClickTime = Date.now();

  // Send the current click count to the new client
  ws.send(JSON.stringify({ clickCount: clickCount, clients: (wss.clients.size) }));

  ws.on('message', async (message) => {
    message = message.toString();
    message = JSON.parse(message);
    if (message.command === 'click') {
      const currentTime = Date.now();
      const timeElapsed = currentTime - ws.lastClickTime;

      if (timeElapsed > 1000) {
        // Reset the counter if more than a second has passed
        ws.clickCounter = 0;
        ws.lastClickTime = currentTime;
      }

      ws.clickCounter++;

      // Check if the click counter exceeds the maximum allowed clicks per second
      if (ws.clickCounter > MAX_CLICKS_PER_SECOND) {
        ws.send(JSON.stringify({ blocked: true }));
        ws.close(1008, 'Too many clicks per second'); // Close the connection with a policy violation code
        return;
      }

      clickCount++;

      // Update the click count in the storage
      await storage.setItem('clickCount', clickCount);
    }
  });

  ws.on('close', () => {
    connectedRayIDs.delete(rayID);
  });
});

if (!broadcastInterval) {
  broadcastInterval = setInterval(() => {
    // Broadcast click count to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ clickCount: clickCount, clients: (wss.clients.size) }));
      }
    });
  }, 500);
}

// Start the server
const PORT = process.env.PORT || 6600;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit('connection', socket, request);
  });
});
