"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StatsService {
    constructor() {
        this.stats = { llmTokenCount: 0, speechDurationSeconds: 0, audioCharacterCount: 0 };
    }
    recordTokens(count) {
        this.stats.llmTokenCount += count;
    }
    recordSpeechDuration(seconds) {
        this.stats.speechDurationSeconds += seconds;
    }
    recordAudioChars(count) {
        this.stats.audioCharacterCount += count;
    }
    resetStats() {
        this.stats.llmTokenCount = 0;
        this.stats.speechDurationSeconds = 0;
        this.stats.audioCharacterCount = 0;
    }
    getStats() {
        return Object.assign({}, this.stats);
    }
}
exports.default = new StatsService();
