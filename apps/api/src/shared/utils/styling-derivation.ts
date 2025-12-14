import { EffectiveStyling } from '../models/card-render-model';

const DEFAULT_STYLING: EffectiveStyling = {
  backgroundType: 'solid',
  backgroundColor: '#ffffff',
  layout: 'vertical',
  fontFamily: 'inter',
  fontSize: 'base',
  borderRadius: 'md',
  shadowPreset: 'sm',
};

export function deriveStyling(
  templateConfig?: any,
  cardOverrides?: any,
  designSystemTokens?: any
): EffectiveStyling {
  const styling: EffectiveStyling = { ...DEFAULT_STYLING };

  if (templateConfig) {
    if (templateConfig.colorScheme?.background) {
      styling.backgroundColor = templateConfig.colorScheme.background;
    }
    if (templateConfig.colorScheme?.backgroundType) {
      styling.backgroundType = templateConfig.colorScheme.backgroundType;
    }
    if (templateConfig.typography?.fontFamily) {
      styling.fontFamily = templateConfig.typography.fontFamily;
    }
    if (templateConfig.typography?.fontSize) {
      styling.fontSize = templateConfig.typography.fontSize;
    }
    if (templateConfig.layout) {
      styling.layout = templateConfig.layout;
    }
    if (templateConfig.borderRadius) {
      styling.borderRadius = templateConfig.borderRadius;
    }
    if (templateConfig.shadow) {
      styling.shadowPreset = templateConfig.shadow;
    }
    if (templateConfig.theme) {
      styling.theme = templateConfig.theme;
    }
    if (templateConfig.customCss) {
      styling.customCss = templateConfig.customCss;
    }
  }

  if (cardOverrides) {
    if (cardOverrides.backgroundType !== undefined) {
      styling.backgroundType = cardOverrides.backgroundType;
    }
    if (cardOverrides.backgroundColor !== undefined) {
      styling.backgroundColor = cardOverrides.backgroundColor;
    }
    if (cardOverrides.backgroundImage !== undefined) {
      styling.backgroundImage = cardOverrides.backgroundImage;
    }
    if (cardOverrides.layout !== undefined) {
      styling.layout = cardOverrides.layout;
    }
    if (cardOverrides.fontFamily !== undefined) {
      styling.fontFamily = cardOverrides.fontFamily;
    }
    if (cardOverrides.fontSize !== undefined) {
      styling.fontSize = cardOverrides.fontSize;
    }
    if (cardOverrides.borderRadius !== undefined) {
      styling.borderRadius = cardOverrides.borderRadius;
    }
    if (cardOverrides.shadowPreset !== undefined) {
      styling.shadowPreset = cardOverrides.shadowPreset;
    }
    if (cardOverrides.customCss !== undefined && cardOverrides.customCss !== null) {
      styling.customCss = cardOverrides.customCss;
    }
    if (cardOverrides.theme !== undefined) {
      styling.theme = cardOverrides.theme;
    }
  }

  return styling;
}
