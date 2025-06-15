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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTemplates = getAllTemplates;
exports.getTemplateById = getTemplateById;
exports.searchTemplates = searchTemplates;
exports.getTemplatesByModel = getTemplatesByModel;
exports.getAllTemplateNames = getAllTemplateNames;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const promptyLoader_1 = require("../prompts/promptyLoader");
const database_service_factory_1 = require("./database-service-factory");
/**
 * Get all templates - uses database if available, falls back to files
 */
function getAllTemplates(dbInstance) {
    try {
        const db = dbInstance !== null && dbInstance !== void 0 ? dbInstance : (database_service_factory_1.databaseServiceFactory.shouldUseDatabase() ? database_service_factory_1.databaseServiceFactory.getDatabase() : null);
        if (db) {
            const templates = db.getAllTemplates();
            return templates.map((template) => {
                var _a, _b;
                return (Object.assign({ id: template.id || template.name, name: ((_a = template.metadata) === null || _a === void 0 ? void 0 : _a.name) || template.name, description: ((_b = template.metadata) === null || _b === void 0 ? void 0 : _b.description) || template.description, prompt: template.content, metadata: template.metadata }, template));
            });
        }
        // Fallback to file system
        console.log('📁 Falling back to file-based template retrieval');
        return getTemplatesFromFiles();
    }
    catch (error) {
        console.error('❌ Error retrieving templates from database, falling back to files:', error);
        return getTemplatesFromFiles();
    }
}
/**
 * Get template by ID - uses database if available, falls back to files
 */
function getTemplateById(id, dbInstance) {
    var _a, _b;
    try {
        const db = dbInstance !== null && dbInstance !== void 0 ? dbInstance : (database_service_factory_1.databaseServiceFactory.shouldUseDatabase() ? database_service_factory_1.databaseServiceFactory.getDatabase() : null);
        if (db) {
            const template = db.getTemplateById(id);
            if (template) {
                return Object.assign({ id: template.id || id, name: ((_a = template.metadata) === null || _a === void 0 ? void 0 : _a.name) || template.name, description: ((_b = template.metadata) === null || _b === void 0 ? void 0 : _b.description) || template.description, prompt: template.content, metadata: template.metadata }, template);
            }
        }
        return getTemplateFromFile(id);
    }
    catch (error) {
        return getTemplateFromFile(id);
    }
}
/**
 * Search templates by term - database only feature with file fallback
 */
function searchTemplates(searchTerm, dbInstance) {
    try {
        const db = dbInstance !== null && dbInstance !== void 0 ? dbInstance : (database_service_factory_1.databaseServiceFactory.shouldUseDatabase() ? database_service_factory_1.databaseServiceFactory.getDatabase() : null);
        if (db) {
            const results = db.searchDocuments('prompt_template', searchTerm);
            return results.map((template) => {
                var _a, _b;
                return (Object.assign({ id: template.id || template.name, name: ((_a = template.metadata) === null || _a === void 0 ? void 0 : _a.name) || template.name, description: ((_b = template.metadata) === null || _b === void 0 ? void 0 : _b.description) || template.description, prompt: template.content, metadata: template.metadata }, template));
            });
        }
        const allTemplates = getTemplatesFromFiles();
        return allTemplates.filter((template) => JSON.stringify(template).toLowerCase().includes(searchTerm.toLowerCase()));
    }
    catch (error) {
        return [];
    }
}
/**
 * Get templates by model type - database feature with file fallback
 */
function getTemplatesByModel(modelType, dbInstance) {
    try {
        const db = dbInstance !== null && dbInstance !== void 0 ? dbInstance : (database_service_factory_1.databaseServiceFactory.shouldUseDatabase() ? database_service_factory_1.databaseServiceFactory.getDatabase() : null);
        if (db) {
            const allTemplates = db.getAllTemplates();
            const results = allTemplates.filter((template) => {
                var _a, _b, _c, _d, _e;
                return ((_c = (_b = (_a = template.metadata) === null || _a === void 0 ? void 0 : _a.model) === null || _b === void 0 ? void 0 : _b.api) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(modelType.toLowerCase())) ||
                    ((_e = (_d = template.model) === null || _d === void 0 ? void 0 : _d.api) === null || _e === void 0 ? void 0 : _e.toLowerCase().includes(modelType.toLowerCase()));
            });
            return results.map((template) => {
                var _a, _b;
                return (Object.assign({ id: template.id || template.name, name: ((_a = template.metadata) === null || _a === void 0 ? void 0 : _a.name) || template.name, description: ((_b = template.metadata) === null || _b === void 0 ? void 0 : _b.description) || template.description, prompt: template.content, metadata: template.metadata }, template));
            });
        }
        const allTemplates = getTemplatesFromFiles();
        return allTemplates.filter((template) => { var _a, _b, _c; return (_c = (_b = (_a = template.metadata) === null || _a === void 0 ? void 0 : _a.model) === null || _b === void 0 ? void 0 : _b.api) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(modelType.toLowerCase()); });
    }
    catch (error) {
        return [];
    }
}
/**
 * Get all template names (IDs and names) from the database if available
 */
function getAllTemplateNames() {
    return __awaiter(this, void 0, void 0, function* () {
        if (database_service_factory_1.databaseServiceFactory.shouldUseDatabase()) {
            const db = database_service_factory_1.databaseServiceFactory.getDatabase();
            if (db && typeof db.getAllTemplateNames === 'function') {
                return db.getAllTemplateNames();
            }
        }
        return [];
    });
}
// File-based implementation functions (private)
function getTemplatesFromFiles() {
    const promptsDir = resolvePromptsDir();
    const files = fs.readdirSync(promptsDir).filter(file => file.endsWith('.prompty'));
    const templates = [];
    for (const file of files) {
        const templateName = path.basename(file, '.prompty');
        try {
            const { metadata, content } = promptyLoader_1.PrompyLoader.loadTemplate(templateName);
            templates.push({
                id: templateName,
                name: metadata.name,
                description: metadata.description,
                prompt: content,
                content,
                metadata
            });
        }
        catch (error) {
            console.warn(`Failed to load template file ${file}:`, error);
        }
    }
    return templates;
}
function getTemplateFromFile(id) {
    try {
        const { metadata, content } = promptyLoader_1.PrompyLoader.loadTemplate(id);
        return {
            id,
            name: metadata.name,
            description: metadata.description,
            prompt: content,
            content,
            metadata
        };
    }
    catch (error) {
        console.warn(`Failed to load template '${id}':`, error);
        return null;
    }
}
function resolvePromptsDir() {
    return database_service_factory_1.databaseServiceFactory.resolvePromptsDir();
}
