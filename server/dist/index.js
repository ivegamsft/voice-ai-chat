"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const openai_1 = __importDefault(require("openai"));
const sdk = __importStar(require("microsoft-cognitiveservices-speech-sdk"));
const errorHandler_1 = require("./middleware/errorHandler");
const personas_1 = __importDefault(require("./routes/personas"));
const templates_1 = __importDefault(require("./routes/templates"));
const chat_1 = __importDefault(require("./routes/chat"));
const speech_1 = __importDefault(require("./routes/speech"));
const stats_1 = __importDefault(require("./routes/stats"));
const token_1 = __importDefault(require("./routes/token"));
const app = (0, express_1.default)();
const PORT = env_1.config.port;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Register personas router first
app.use('/api/personas', personas_1.default);
// Initialize OpenAI client
let openai = null;
if (env_1.config.azureOpenAiEndpoint && env_1.config.azureOpenAiKey) {
    openai = new openai_1.default({
        apiKey: env_1.config.azureOpenAiKey,
        baseURL: `${env_1.config.azureOpenAiEndpoint}/openai/deployments/${env_1.config.azureOpenAiDeployment}`,
        defaultQuery: { 'api-version': '2023-05-15' },
        defaultHeaders: { 'api-key': env_1.config.azureOpenAiKey },
    });
}
// Azure Speech Service Configuration
const AZURE_SPEECH_KEY = 'your-azure-speech-key';
const AZURE_SPEECH_REGION = 'your-azure-speech-region'; // e.g., 'eastus'
// Note: Replace these values with your actual Azure Speech Service credentials
// Azure TTS Configuration
const speechConfig = sdk.SpeechConfig.fromSubscription(env_1.config.azureSpeechKey, env_1.config.azureSpeechRegion);
// Set the voice name (you can change this to a different voice if needed)
speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';
// Set the output format to 24KHz audio
speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});
// Register routes
app.use('/api/templates', templates_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/speech', speech_1.default);
app.use('/api/speech/token', token_1.default);
app.use('/api/stats', stats_1.default);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`OpenAI client initialized: ${!!openai}`);
    console.log(`Azure Speech config initialized: ${!!speechConfig}`);
});
