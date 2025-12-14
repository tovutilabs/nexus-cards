import { BadRequestException } from '@nestjs/common';

export interface CssSanitizerResult {
  sanitized: string;
  isValid: boolean;
  errors: string[];
}

const CSS_MAX_SIZE_BYTES = 100 * 1024; // 100 KB

const ALLOWED_PROPERTIES = [
  'color', 'background', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-color', 'border-style', 'border-width',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'font', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
  'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-decoration', 'text-transform', 'text-indent',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'display', 'position', 'top', 'right', 'bottom', 'left',
  'float', 'clear', 'overflow', 'overflow-x', 'overflow-y',
  'opacity', 'visibility', 'z-index',
  'box-shadow', 'text-shadow',
  'transition', 'transform', 'animation',
  'cursor', 'outline', 'outline-color', 'outline-style', 'outline-width',
  'list-style', 'list-style-type', 'list-style-position', 'list-style-image',
  'vertical-align', 'white-space', 'word-break', 'word-wrap',
  'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'justify-content', 'align-items', 'align-content',
  'grid', 'grid-template', 'grid-gap', 'gap',
];

const DANGEROUS_PATTERNS = [
  { pattern: /@import/gi, name: '@import directive' },
  { pattern: /expression\s*\(/gi, name: 'expression() function' },
  { pattern: /behavior\s*:/gi, name: 'behavior property' },
  { pattern: /-moz-binding/gi, name: '-moz-binding property' },
  { pattern: /javascript\s*:/gi, name: 'javascript: protocol' },
  { pattern: /vbscript\s*:/gi, name: 'vbscript: protocol' },
  { pattern: /data\s*:(?!image\/)/gi, name: 'data: protocol (non-image)' },
  { pattern: /<script/gi, name: '<script> tag' },
  { pattern: /<\/script/gi, name: '</script> tag' },
  { pattern: /<iframe/gi, name: '<iframe> tag' },
  { pattern: /<object/gi, name: '<object> tag' },
  { pattern: /<embed/gi, name: '<embed> tag' },
  { pattern: /<!DOCTYPE/gi, name: 'DOCTYPE declaration' },
  { pattern: /<html/gi, name: '<html> tag' },
  { pattern: /<head/gi, name: '<head> tag' },
  { pattern: /<body/gi, name: '<body> tag' },
  { pattern: /on\w+\s*=/gi, name: 'event handler attributes' },
  { pattern: /\/\*[\s\S]*?\*\//g, name: 'CSS comments' }, // Remove comments but don't error
];

export function sanitizeCss(css: string | null | undefined): CssSanitizerResult {
  const errors: string[] = [];
  
  if (!css) {
    return {
      sanitized: '',
      isValid: true,
      errors: [],
    };
  }

  let sanitized = css.trim();

  // Check size limit
  const sizeInBytes = Buffer.byteLength(sanitized, 'utf8');
  if (sizeInBytes > CSS_MAX_SIZE_BYTES) {
    return {
      sanitized: '',
      isValid: false,
      errors: [`CSS size exceeds maximum allowed (${CSS_MAX_SIZE_BYTES / 1024}KB). Current size: ${(sizeInBytes / 1024).toFixed(2)}KB`],
    };
  }

  // Check for dangerous patterns
  for (const { pattern, name } of DANGEROUS_PATTERNS) {
    if (name === 'CSS comments') {
      // Remove comments silently
      sanitized = sanitized.replace(pattern, '');
    } else if (pattern.test(sanitized)) {
      errors.push(`Blocked dangerous pattern: ${name}`);
    }
  }

  if (errors.length > 0) {
    return {
      sanitized: '',
      isValid: false,
      errors,
    };
  }

  // Remove dangerous patterns
  for (const { pattern } of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Validate CSS properties (basic validation)
  // This is a simple check - more sophisticated parsing could be added
  const lines = sanitized.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('{') && !trimmedLine.startsWith('}') && trimmedLine.includes(':')) {
      const propertyMatch = trimmedLine.match(/^\s*([a-z-]+)\s*:/i);
      if (propertyMatch) {
        const property = propertyMatch[1].toLowerCase();
        if (!ALLOWED_PROPERTIES.includes(property)) {
          errors.push(`Disallowed CSS property: ${property}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return {
      sanitized: '',
      isValid: false,
      errors,
    };
  }

  return {
    sanitized: sanitized.trim(),
    isValid: true,
    errors: [],
  };
}

export function validateAndSanitizeCss(css: string | null | undefined): string {
  const result = sanitizeCss(css);
  
  if (!result.isValid) {
    throw new BadRequestException({
      code: 'CUSTOM_CSS_INVALID',
      message: 'Custom CSS validation failed',
      errors: result.errors,
    });
  }
  
  return result.sanitized;
}
