import type { ParsedQuestion, ParseResult } from '@/types/types';

/**
 * Parse TXT file content following flexible format rules:
 * - Questions can have numbering (1), 2), etc.) which will be stripped
 * - Questions can be multi-line (e.g., English + Hindi)
 * - Questions separated by exactly ONE empty line
 * - Options: start with * (correct) or - (wrong), continuous lines
 * - Explanation: optional, starts with >, immediately after options
 */
export function parseTxtQuestions(content: string): ParseResult {
  const valid: ParsedQuestion[] = [];
  const invalid: { block: string; reason: string }[] = [];

  // Normalize line endings (handle Windows \r\n, Unix \n, Mac \r)
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by double newline (one empty line between questions)
  // This regex matches one or more empty lines (lines with only whitespace)
  const blocks = normalizedContent
    .split(/\n\s*\n+/)
    .map(block => block.trim())
    .filter(block => block.length > 0);

  console.log(`Found ${blocks.length} question blocks`);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    try {
      const parsed = parseQuestionBlock(block);
      valid.push(parsed);
    } catch (error) {
      invalid.push({
        block: `Question ${i + 1}: ${block.substring(0, 100)}${block.length > 100 ? '...' : ''}`,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  console.log(`Parsed ${valid.length} valid questions, ${invalid.length} invalid`);

  return { valid, invalid };
}

function parseQuestionBlock(block: string): ParsedQuestion {
  const lines = block.split('\n').map((line) => line.trim()).filter(line => line);
  
  let question = '';
  const options: string[] = [];
  const correct: number[] = [];
  let explanation = '';
  
  let mode: 'question' | 'options' | 'explanation' = 'question';
  
  for (const line of lines) {
    // Check for explanation line
    if (line.startsWith('>')) {
      mode = 'explanation';
      explanation = line.substring(1).trim();
      continue;
    }

    // Check for option line
    if (line.startsWith('*') || line.startsWith('-')) {
      mode = 'options';
      const isCorrect = line.startsWith('*');
      const optionText = line.substring(1).trim();
      
      if (!optionText) {
        throw new Error('Option text cannot be empty');
      }
      
      if (isCorrect) {
        correct.push(options.length);
      }
      
      options.push(optionText);
      continue;
    }

    // Otherwise, it's part of the current section
    if (mode === 'question') {
      // Strip question numbering like "1)", "2)", "10)", etc.
      let cleanLine = line;
      const numberingMatch = line.match(/^\d+\)\s*/);
      if (numberingMatch && !question) {
        // Only strip numbering from the first line of the question
        cleanLine = line.substring(numberingMatch[0].length);
      }
      
      question += (question ? '\n' : '') + cleanLine;
    } else if (mode === 'options') {
      // Multi-line option: append to the last option
      if (options.length > 0) {
        options[options.length - 1] += ' ' + line;
      } else {
        throw new Error('Invalid format: options must start with * or -');
      }
    } else if (mode === 'explanation') {
      explanation += ' ' + line;
    }
  }

  // Validation
  if (!question) {
    throw new Error('Question text is required');
  }

  if (options.length < 2) {
    throw new Error('Minimum 2 options required');
  }

  if (correct.length === 0) {
    throw new Error('At least one correct answer is required');
  }

  return {
    question,
    options,
    correct,
    explanation: explanation || undefined,
  };
}
