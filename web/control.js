const reconnectInterval = 1000;
let clicks = 0;
let clients = 0;
let socket;

function toggleAbout() {
  const about = document.getElementById('about');
  about.style.display = about.style.display === 'none' ? 'block' : 'none';
}

function updateText() {
  let elem = document.getElementById('counter');
  elem.innerHTML = `Clicks: <span class="mono">${clicks}</span><br />Clients: <span class="mono">${clients}</span>`;
}

function connect() {
  socket = new WebSocket('wss://' + window.location.host);

  socket.onopen = function(event) {
    console.log('WebSocket is connected.');
  };

  socket.onmessage = function(event) {
    const data = JSON.parse(event.data);

    if (data.blocked) {
      alert('Irregular behaviour detected, connection closed. If you think this is a mistake, please contact me on Telegram, Discord, or Mastodon.');
      return;
    }

    clicks = data.clickCount;
    clients = data.clients;
    updateText();
  };

  socket.onerror = function(error) {
    console.error('WebSocket Error: ', error);
  };

  socket.onclose = function(event) {
    console.log('WebSocket is closed now. Reconnecting in ' + reconnectInterval / 1000 + ' seconds.');
    document.getElementById('counter').innerText = "Lost connection to CountBroker, retrying...";
    setTimeout(connect, reconnectInterval);
  };
}

function hajclick() {
  if (socket.readyState === WebSocket.OPEN) {
    clicks++;
    updateText();
    socket.send(JSON.stringify({ command: 'click' }));
  } else {
    console.error('WebSocket is not open.');
    alert("Hey! I'm trying to (re)connect! Give me a sec!");
  }
}

function splash() {
  const texts = [
    "I love you Robby!",
    "Thank you Danny!",
    "Thank you Matt!",
    "Thank you blumlaut!",
    "Thank you Terrence!",
    "Thank you Tristan!",
    "Thank you Tyler!",
    "Thank you Agrius!",
    "F*ck you Adrian!",
    "I am a splash text!",
    "Honestly quite incredible!",
    "Nani-nani-boo-boo!",
    "Actually not that great!",
    "It's like gold dust!",
    "I've ddosed myself!",
    "Cider rulez!",
    "Thank you Elijah!",
    "maik x marian!",
    "I'm glad you're here!",
    "Don't give up!",
    "Just Dance!",
    "28 Cyberpunk!",
    "Rythm of the Night!",
    "Like a G6!",
    "/give @a ikea:blahaj 64",
    "So good yet so gay!",
    "<a href='https://skepsiskadser.de/'>Skepsiskadser.de!</a>",
    "<a href='https://finnley.dev/'>finnley.dev!</a>",
    "Not optimized for mobile!",
    "Join Mastodon!",
    "Haj-end software!",
    "Soft like a fox' tail!",
    "Be nice to Finn please!",
    "Now with 100% less grandma!",
    "I'm not a robot!",
    "The backend is terrible!",
    "Sorry, the ice cream machine is broken",
    "I can't read!",
    "Now with Bitcoin miners!",
    "<a href='https://spellic.stefftek.de/'>Wishlist Spellic!</a>",
    "<a href='https://www.youtube.com/watch?v=dQw4w9WgXcQ'>Click here for free V-Bucks!</a>",
    "hehehehehe",
    "Hosted on a terrible home server!",
    "10TB of HGST!",
    "Did I mention Arctic Fox yet?",
    "BLAHAJ IS YOU",
    "Do you have the LIDL Plus App?",
  ];

  // choose random text and apply it to the splash box
  const randomIndex = Math.floor(Math.random() * texts.length);
  const splashElement = document.getElementById('splash');
  if (splashElement) {
    splashElement.innerHTML = texts[randomIndex];
  } else {
    console.error('Element with id "splash" not found.');
  }
}

connect();