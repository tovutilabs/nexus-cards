import { sanitizeCss, validateAndSanitizeCss } from './css-sanitizer';
import { BadRequestException } from '@nestjs/common';

describe('CSS Sanitizer', () => {
  describe('sanitizeCss', () => {
    it('should allow valid CSS properties', () => {
      const css = `
        .card {
          color: #333;
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
        }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should block @import directive', () => {
      const css = `
        @import url("malicious.css");
        .card { color: red; }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Blocked dangerous pattern: @import directive');
    });

    it('should block expression() function', () => {
      const css = `
        .card {
          width: expression(alert('XSS'));
        }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('expression()'))).toBe(true);
    });

    it('should block javascript: protocol', () => {
      const css = `
        .card {
          background-image: url(javascript:alert('XSS'));
        }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('javascript:'))).toBe(true);
    });

    it('should block script tags', () => {
      const css = `
        <script>alert('XSS')</script>
        .card { color: red; }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('<script>'))).toBe(true);
    });

    it('should block event handler attributes', () => {
      const css = `
        .card {
          onclick="alert('XSS')";
        }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('event handler'))).toBe(true);
    });

    it('should reject CSS exceeding size limit', () => {
      const largeCss = 'a'.repeat(101 * 1024); // 101KB
      const result = sanitizeCss(largeCss);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum'))).toBe(true);
    });

    it('should return empty string for null or undefined', () => {
      expect(sanitizeCss(null).sanitized).toBe('');
      expect(sanitizeCss(undefined).sanitized).toBe('');
      expect(sanitizeCss('').sanitized).toBe('');
    });

    it('should remove CSS comments silently', () => {
      const css = `
        /* This is a comment */
        .card {
          color: red; /* inline comment */
        }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).not.toContain('/*');
      expect(result.sanitized).not.toContain('*/');
    });

    it('should block disallowed CSS properties', () => {
      const css = `
        .card {
          -webkit-user-select: none;
        }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Disallowed CSS property'))).toBe(true);
    });

    it('should allow flexbox properties', () => {
      const css = `
        .card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(true);
    });

    it('should allow grid properties', () => {
      const css = `
        .container {
          display: grid;
          grid-template: auto / 1fr 1fr;
          gap: 20px;
        }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(true);
    });

    it('should allow box-shadow and text-shadow', () => {
      const css = `
        .card {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-shadow: 1px 1px 2px #000;
        }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(true);
    });

    it('should allow transitions and transforms', () => {
      const css = `
        .button {
          transition: all 0.3s ease;
          transform: scale(1.1);
        }
      `;
      const result = sanitizeCss(css);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateAndSanitizeCss', () => {
    it('should return sanitized CSS for valid input', () => {
      const css = '.card { color: blue; }';
      const result = validateAndSanitizeCss(css);
      expect(result).toContain('color');
    });

    it('should throw BadRequestException for invalid CSS', () => {
      const css = '@import url("evil.css");';
      expect(() => validateAndSanitizeCss(css)).toThrow(BadRequestException);
    });

    it('should throw exception with CUSTOM_CSS_INVALID code', () => {
      const css = 'javascript:alert("XSS")';
      try {
        validateAndSanitizeCss(css);
        fail('Should have thrown exception');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('CUSTOM_CSS_INVALID');
      }
    });
  });
});
