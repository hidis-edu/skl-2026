import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for WhatsApp
  app.post('/api/whatsapp/send', async (req, res) => {
    const { number, text } = req.body;
    const apiKey = process.env.EVO_API_KEY || 'nganjuk123';
    const apiUrl = process.env.EVO_API_URL || 'https://evo.hidis.id/message/sendText/hidis';

    if (!number || !text) {
      return res.status(400).json({ status: 'error', message: 'Number and text are required' });
    }

    try {
      console.log('--- WhatsApp Debug Start ---');
      console.log('Target Number:', number);
      console.log('API URL:', apiUrl);
      
      const response = await axios.post(apiUrl, {
        number,
        text
      }, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        }
      });
      
      console.log('Evolution API Response Status:', response.status);
      console.log('Evolution API Response Data:', JSON.stringify(response.data, null, 2));
      
      res.json({
        success: true,
        ...response.data
      });
    } catch (error: any) {
      const errorResponse = error.response?.data;
      const errorStatus = error.response?.status;
      
      console.error('WhatsApp Error Status:', errorStatus);
      console.error('WhatsApp Error Body:', JSON.stringify(errorResponse || error.message, null, 2));
      
      res.status(errorStatus || 500).json({
        status: 'error',
        message: 'Failed to send WhatsApp message',
        details: errorResponse,
        statusCode: errorStatus
      });
    } finally {
      console.log('--- WhatsApp Debug End ---');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
