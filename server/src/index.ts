import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import OpenAI from 'openai';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { errorHandler } from './middleware/errorHandler';
import personasRouter from './routes/personas';
import templatesRouter from './routes/templates';
import chatRouter from './routes/chat';
import speechRouter from './routes/speech';
import statsRouter from './routes/stats';
import tokenRouter from './routes/token';

const app: Express = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Register personas router first
app.use('/api/personas', personasRouter);

// Initialize OpenAI client
let openai: OpenAI | null = null;

if (config.azureOpenAiEndpoint && config.azureOpenAiKey) {
  openai = new OpenAI({
    apiKey: config.azureOpenAiKey,
    baseURL: `${config.azureOpenAiEndpoint}/openai/deployments/${config.azureOpenAiDeployment}`,
    defaultQuery: { 'api-version': '2023-05-15' },
    defaultHeaders: { 'api-key': config.azureOpenAiKey },
  });
}

// Azure Speech Service Configuration
const AZURE_SPEECH_KEY = 'your-azure-speech-key';
const AZURE_SPEECH_REGION = 'your-azure-speech-region'; // e.g., 'eastus'

// Note: Replace these values with your actual Azure Speech Service credentials

// Azure TTS Configuration
const speechConfig = sdk.SpeechConfig.fromSubscription(
  config.azureSpeechKey,
  config.azureSpeechRegion
);

// Set the voice name (you can change this to a different voice if needed)
speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';

// Set the output format to 24KHz audio
speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Register routes
app.use('/api/templates', templatesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/speech', speechRouter);
app.use('/api/speech/token', tokenRouter);
app.use('/api/stats', statsRouter);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`OpenAI client initialized: ${!!openai}`);
  console.log(`Azure Speech config initialized: ${!!speechConfig}`);
});
