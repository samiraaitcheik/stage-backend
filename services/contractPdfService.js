// import PDFDocument from 'pdfkit'; // Temporarily commented
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../prismaClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create PDFs directory if it doesn't exist
const pdfDir = path.join(__dirname, '../public/pdfs');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

/**
 * Generate a contract PDF for an employee
 * TEMPORAIREMENT DÉSACTIVÉ - Nécessite pdfkit
 * @param {string} contractId - Employee contract ID
 * @returns {Promise<{path: string, filename: string}>}
 */
export const generateContractPdf = async (contractId) => {
  // TODO: Réactiver après installation de pdfkit
  throw { status: 503, message: 'Génération de PDF temporairement désactivée. Veuillez contacter l\'administrateur.' };
};

/**
 * Get contract PDF file
 * @param {string} filename - PDF filename
 * @returns {Promise<string>} - Full file path
 */
export const getContractPdf = async (filename) => {
  const filepath = path.join(pdfDir, filename);
  
  // Security check: prevent directory traversal
  if (!filepath.startsWith(pdfDir)) {
    throw { status: 403, message: 'Access denied' };
  }

  if (!fs.existsSync(filepath)) {
    throw { status: 404, message: 'PDF file not found' };
  }

  return filepath;
};
