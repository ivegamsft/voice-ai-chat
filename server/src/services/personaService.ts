import * as path from 'path';
import * as fs from 'fs';
import { databaseServiceFactory } from './database-service-factory';
import type { Persona } from '../types/api';

/**
 * Get all personas - uses database if available, falls back to files
 */
export function getAllPersonas(dbInstance?: any): Persona[] {
  try {
    const db = dbInstance ?? (databaseServiceFactory.shouldUseDatabase() ? databaseServiceFactory.getDatabase() : null);
    if (db) {
      const personas: any[] = db.getAllPersonas();
      return personas.map((persona: any): Persona => ({
        ...persona
      }));
    }
    return getPersonasFromFiles();
  } catch (error) {
    return getPersonasFromFiles();
  }
}

/**
 * Get persona by ID - uses database if available, falls back to files
 */
export function getPersonaById(id: string, dbInstance?: any): Persona | null {
  try {
    const db = dbInstance ?? (databaseServiceFactory.shouldUseDatabase() ? databaseServiceFactory.getDatabase() : null);
    if (db) {
      const persona: any = db.getPersonaById(id);
      if (persona) {
        return { ...persona };
      }
    }
    return getPersonaFromFile(id);
  } catch (error) {
    return getPersonaFromFile(id);
  }
}

/**
 * Search personas by term - database only feature with file fallback
 */
export function searchPersonas(searchTerm: string, dbInstance?: any): Persona[] {
  try {
    const db = dbInstance ?? (databaseServiceFactory.shouldUseDatabase() ? databaseServiceFactory.getDatabase() : null);
    if (db) {
      const results: any[] = db.searchDocuments('persona', searchTerm);
      return results.map((persona: any): Persona => ({ ...persona }));
    }
    const allPersonas = getPersonasFromFiles();
    return allPersonas.filter((persona: any) => 
      JSON.stringify(persona).toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    return [];
  }
}

/**
 * Get personas by age group - database feature with file fallback
 */
export function getPersonasByAgeGroup(ageGroup: string, dbInstance?: any): Persona[] {
  try {
    const db = dbInstance ?? (databaseServiceFactory.shouldUseDatabase() ? databaseServiceFactory.getDatabase() : null);
    if (db && 'getPersonasByAgeGroup' in db) {
      const results: any[] = (db as any).getPersonasByAgeGroup(ageGroup);
      return results.map((persona: any): Persona => ({ ...persona }));
    }
    const allPersonas = getPersonasFromFiles();
    return allPersonas.filter((persona: any) => 
      persona.demographics?.ageGroup?.toLowerCase().includes(ageGroup.toLowerCase())
    );
  } catch (error) {
    return [];
  }
}

/**
 * Format persona details for template substitution
 */
export function formatPersonaForTemplate(persona: Persona): Record<string, string> {
  if (!persona) return {};

  console.log('PersonaService: Formatting persona for template:', persona);

  const formatted: Record<string, string> = {
    persona_name: persona.name || '',
    persona_id: persona.id || '',
  };

  // Add demographics as separate fields
  if (persona.demographics) {
    Object.entries(persona.demographics).forEach(([key, value]) => {
      formatted[`persona_${key}`] = String(value || '');
    });
  }

  // Add main persona characteristics
  formatted.persona_behavior = persona.behavior || '';
  formatted.persona_needs = persona.needs || '';
  formatted.persona_painpoints = persona.painpoints || '';

  // Also provide a combined persona description for templates that expect it
  const parts = [];
  if (persona.name) parts.push(`Name: ${persona.name}`);
  if (persona.demographics) {
    const demo = Object.entries(persona.demographics)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    if (demo) parts.push(`Demographics: ${demo}`);
  }
  if (persona.behavior) parts.push(`Behavior: ${persona.behavior}`);
  if (persona.needs) parts.push(`Needs: ${persona.needs}`);
  if (persona.painpoints) parts.push(`Pain Points: ${persona.painpoints}`);
  
  formatted.persona = parts.join('\n');
  
  console.log('PersonaService: Formatted persona parameters:', formatted);
  return formatted;
}

// File-based implementation functions (private)
function getPersonasFromFiles(): any[] {
  const personasDir = resolvePersonasDir();
  const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.json'));
  const personas = [];
  
  for (const file of files) {
    try {
      const personaPath = path.join(personasDir, file);
      const persona = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
      
      // Add ID if not present
      if (!persona.id) {
        persona.id = path.basename(file, '.json');
      }
      
      personas.push(persona);
    } catch (err) {
      console.warn(`Failed to load persona file ${file}:`, err);
    }
  }
  
  return personas;
}

function getPersonaFromFile(id: string): any | null {
  const personasDir = resolvePersonasDir();
  const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.json'));
  const personaFile = files.find(f => f.replace(/\.json$/, '') === id);
  
  if (!personaFile) return null;
  
  try {
    const personaPath = path.join(personasDir, personaFile);
    const persona = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
    
    // Add ID if not present
    if (!persona.id) {
      persona.id = id;
    }
    
    return persona;
  } catch (err) {
    console.warn(`Failed to load persona file ${personaFile}:`, err);
    return null;
  }
}

function resolvePersonasDir(): string {
  return databaseServiceFactory.resolvePersonasDir();
}
