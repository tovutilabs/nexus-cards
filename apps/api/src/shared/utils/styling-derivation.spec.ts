import { deriveStyling } from './styling-derivation';

describe('deriveStyling', () => {
  it('should return default styling when no config provided', () => {
    const result = deriveStyling();

    expect(result).toEqual({
      backgroundType: 'solid',
      backgroundColor: '#ffffff',
      layout: 'vertical',
      fontFamily: 'inter',
      fontSize: 'base',
      borderRadius: 'md',
      shadowPreset: 'sm',
    });
  });

  it('should apply template config only', () => {
    const templateConfig = {
      colorScheme: {
        background: '#f0f0f0',
        backgroundType: 'gradient',
      },
      typography: {
        fontFamily: 'roboto',
        fontSize: 'lg',
      },
      layout: 'horizontal',
      borderRadius: 'rounded',
      shadow: 'medium',
      theme: { primary: '#3b82f6' },
    };

    const result = deriveStyling(templateConfig);

    expect(result.backgroundColor).toBe('#f0f0f0');
    expect(result.backgroundType).toBe('gradient');
    expect(result.fontFamily).toBe('roboto');
    expect(result.fontSize).toBe('lg');
    expect(result.layout).toBe('horizontal');
    expect(result.borderRadius).toBe('rounded');
    expect(result.shadowPreset).toBe('medium');
    expect(result.theme).toEqual({ primary: '#3b82f6' });
  });

  it('should apply card overrides only', () => {
    const cardOverrides = {
      backgroundColor: '#000000',
      backgroundType: 'image',
      backgroundImage: 'https://example.com/bg.jpg',
      fontFamily: 'arial',
      fontSize: 'sm',
      layout: 'centered',
      borderRadius: 'pill',
      shadowPreset: 'strong',
      customCss: '.card { color: red; }',
    };

    const result = deriveStyling(null, cardOverrides);

    expect(result.backgroundColor).toBe('#000000');
    expect(result.backgroundType).toBe('image');
    expect(result.backgroundImage).toBe('https://example.com/bg.jpg');
    expect(result.fontFamily).toBe('arial');
    expect(result.fontSize).toBe('sm');
    expect(result.layout).toBe('centered');
    expect(result.borderRadius).toBe('pill');
    expect(result.shadowPreset).toBe('strong');
    expect(result.customCss).toBe('.card { color: red; }');
  });

  it('should prioritize card overrides over template config', () => {
    const templateConfig = {
      colorScheme: {
        background: '#f0f0f0',
      },
      typography: {
        fontFamily: 'roboto',
      },
      layout: 'horizontal',
    };

    const cardOverrides = {
      backgroundColor: '#000000',
      fontFamily: 'arial',
      layout: 'vertical',
    };

    const result = deriveStyling(templateConfig, cardOverrides);

    expect(result.backgroundColor).toBe('#000000');
    expect(result.fontFamily).toBe('arial');
    expect(result.layout).toBe('vertical');
  });

  it('should merge template and card overrides correctly', () => {
    const templateConfig = {
      colorScheme: {
        background: '#f0f0f0',
      },
      typography: {
        fontFamily: 'roboto',
      },
      borderRadius: 'rounded',
    };

    const cardOverrides = {
      layout: 'horizontal',
      fontSize: 'lg',
    };

    const result = deriveStyling(templateConfig, cardOverrides);

    expect(result.backgroundColor).toBe('#f0f0f0');
    expect(result.fontFamily).toBe('roboto');
    expect(result.borderRadius).toBe('rounded');
    expect(result.layout).toBe('horizontal');
    expect(result.fontSize).toBe('lg');
  });

  it('should handle partial template config', () => {
    const templateConfig = {
      colorScheme: {
        background: '#f0f0f0',
      },
    };

    const result = deriveStyling(templateConfig);

    expect(result.backgroundColor).toBe('#f0f0f0');
    expect(result.fontFamily).toBe('inter');
    expect(result.layout).toBe('vertical');
  });

  it('should handle undefined values in overrides', () => {
    const cardOverrides = {
      backgroundColor: undefined,
      fontFamily: 'arial',
    };

    const result = deriveStyling(null, cardOverrides);

    expect(result.backgroundColor).toBe('#ffffff');
    expect(result.fontFamily).toBe('arial');
  });
});
