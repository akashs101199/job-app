const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Parse resume file (PDF or DOCX) and extract text content
 *
 * @param {string} filePath - Path to the resume file
 * @param {string} fileType - File type: 'pdf' or 'docx'
 * @returns {Promise<{text: string, metadata: object}>} Extracted text and metadata
 */
const parseResumeFile = async (filePath, fileType) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    let extractedText = '';
    const metadata = {
      fileType,
      parseMethod: null,
      characterCount: 0,
      wordCount: 0,
      lineCount: 0,
      sections: [],
    };

    if (fileType === 'pdf') {
      const result = await extractPdfText(filePath);
      extractedText = result.text;
      metadata.parseMethod = 'pdf-parse';
      metadata.pageCount = result.pageCount;
    } else if (fileType === 'docx') {
      const result = await extractDocxText(filePath);
      extractedText = result.value;
      metadata.parseMethod = 'mammoth';
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Clean and normalize the extracted text
    const cleanedText = cleanExtractedText(extractedText);

    // Calculate metadata
    metadata.characterCount = cleanedText.length;
    metadata.wordCount = cleanedText.split(/\s+/).filter(w => w.length > 0).length;
    metadata.lineCount = cleanedText.split('\n').length;
    metadata.sections = identifyResumeSections(cleanedText);

    return {
      text: cleanedText,
      metadata,
    };
  } catch (err) {
    console.error('Error parsing resume file:', err);
    throw err;
  }
};

/**
 * Extract text from PDF file
 *
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<{text: string, pageCount: number}>}
 */
const extractPdfText = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(fileBuffer);

    const text = pdfData.text || '';
    const pageCount = pdfData.numpages || 0;

    return {
      text,
      pageCount,
    };
  } catch (err) {
    console.error('Error extracting PDF text:', err);
    throw new Error(`Failed to extract PDF text: ${err.message}`);
  }
};

/**
 * Extract text from DOCX file
 *
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<{value: string}>}
 */
const extractDocxText = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });

    if (result.messages && result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages);
    }

    return result;
  } catch (err) {
    console.error('Error extracting DOCX text:', err);
    throw new Error(`Failed to extract DOCX text: ${err.message}`);
  }
};

/**
 * Clean and normalize extracted text
 *
 * @param {string} text - Raw extracted text
 * @returns {string} Cleaned text
 */
const cleanExtractedText = (text) => {
  if (!text) return '';

  // Remove extra whitespace and empty lines
  let cleaned = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  // Remove multiple consecutive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove special characters that are likely OCR artifacts
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize whitespace
  cleaned = cleaned.replace(/\t/g, ' ').replace(/  +/g, ' ');

  return cleaned;
};

/**
 * Identify resume sections from text
 *
 * @param {string} text - Resume text content
 * @returns {Array} Array of identified sections
 */
const identifyResumeSections = (text) => {
  const sectionKeywords = {
    experience: ['experience', 'work history', 'employment', 'professional experience'],
    education: ['education', 'academic', 'degree', 'university', 'college'],
    skills: ['skills', 'technical skills', 'competencies', 'expertise'],
    projects: ['projects', 'portfolio', 'achievements', 'accomplishments'],
    certifications: ['certifications', 'licenses', 'credentials', 'awards'],
    summary: ['summary', 'objective', 'professional summary', 'profile'],
  };

  const sections = [];
  const textLower = text.toLowerCase();

  for (const [section, keywords] of Object.entries(sectionKeywords)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        sections.push(section);
        break;
      }
    }
  }

  return [...new Set(sections)]; // Remove duplicates
};

/**
 * Validate file type
 *
 * @param {string} mimeType - MIME type of the file
 * @returns {boolean} True if valid resume file type
 */
const validateFileType = (mimeType) => {
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];

  return validTypes.includes(mimeType);
};

/**
 * Validate file size
 *
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes (default: 5MB)
 * @returns {boolean} True if file size is valid
 */
const validateFileSize = (fileSize, maxSize = 5242880) => {
  return fileSize > 0 && fileSize <= maxSize;
};

/**
 * Get file extension from MIME type
 *
 * @param {string} mimeType - MIME type
 * @returns {string} File extension (pdf or docx)
 */
const getFileExtension = (mimeType) => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return 'docx';
  }
  return null;
};

/**
 * Generate unique filename for uploaded resume
 *
 * @param {string} userId - User email
 * @param {string} extension - File extension
 * @returns {string} Unique filename
 */
const generateResumeFilename = (userId, extension) => {
  const timestamp = Date.now();
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, '_');
  return `resume_${sanitizedUserId}_${timestamp}.${extension}`;
};

module.exports = {
  parseResumeFile,
  extractPdfText,
  extractDocxText,
  cleanExtractedText,
  identifyResumeSections,
  validateFileType,
  validateFileSize,
  getFileExtension,
  generateResumeFilename,
};
