// A simple, extensible Node.js proxy server for the Hindi Learning App.
// This server handles fetching Text-to-Speech (TTS) audio to avoid browser CORS issues
// and can be easily extended with more API routes in the future.

// Import required modules
const express = require('express');
const https = require('https'); // Use 'https' for making requests to the Google TTS URL
const cors = require('cors');   // Middleware to enable CORS for your frontend

// --- Server Configuration ---
const PORT = process.env.PORT || 3010; // Use port 3010 unless specified in environment
const app = express();

// --- Middleware ---

// Enable CORS so your frontend (hindi-help.apps.atom-ops.ca) can call this API
app.use(cors({
  origin: 'https://hindi-help.apps.atom-ops.ca' // Restrict access to your app's domain
}));

// --- API Routes ---

/**
 * @route   GET /health
 * @desc    A simple health check endpoint for load balancers or monitoring services.
 * @access  Public
 */
app.get('/health', (req, res) => {
  // Always respond with a 200 OK status and a simple message.
  res.status(200).send('OK');
});

/**
 * @route   GET /tts
 * @desc    Proxies a request to the Google Translate TTS service.
 * It fetches the audio on the server and streams it back to the client.
 * @query   text - The Hindi text to be converted to speech.
 * @access  Public
 */
app.get('/tts', (req, res) => {
  const { text } = req.query;

  // Validate that the 'text' query parameter is present
  if (!text) {
    return res.status(400).send('Error: "text" query parameter is required.');
  }

  // Encode the text for the URL
  const encodedText = encodeURIComponent(text);
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=hi&client=tw-ob&q=${encodedText}`;

  // Make a request from the server to the Google TTS URL
  const proxyRequest = https.get(googleTtsUrl, (proxyResponse) => {
    // Check if the response from Google is successful
    if (proxyResponse.statusCode !== 200) {
      console.error(`Google TTS request failed with status: ${proxyResponse.statusCode}`);
      res.status(proxyResponse.statusCode).send('Failed to fetch audio from provider.');
      return;
    }

    // Set the proper content type for the audio file on our response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline'); // Ensures the browser plays the file

    // Pipe the audio stream from Google's response directly to our client's response
    proxyResponse.pipe(res);
  });

  // Handle any errors during the proxy request (e.g., network issues)
  proxyRequest.on('error', (error) => {
    console.error('Error proxying TTS request:', error.message);
    res.status(500).send('Server error while trying to fetch audio.');
  });
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Hindi Help API server running on port ${PORT}`);
});
