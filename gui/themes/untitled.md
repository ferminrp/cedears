# Untitled

Generated from the current project, including edits awaiting autosave. Return to the [theme index](../themes.md). Font names and weights are references only: license, download, and configure your own fonts.

## Foundations

```json
{
  "name": "Untitled",
  "text": {
    "xxs": {
      "size": 9,
      "lineHeight": 12,
      "letterSpacing": 0
    },
    "xs": {
      "size": 11,
      "lineHeight": 14,
      "letterSpacing": 0
    },
    "s": {
      "size": 12,
      "lineHeight": 18,
      "letterSpacing": 0
    },
    "m": {
      "size": 14,
      "lineHeight": 21,
      "letterSpacing": 0
    },
    "l": {
      "size": 21,
      "lineHeight": 28,
      "letterSpacing": 0
    },
    "xl": {
      "size": 32,
      "lineHeight": 35,
      "letterSpacing": 0
    },
    "xxl": {
      "size": 42,
      "lineHeight": 46,
      "letterSpacing": 0
    }
  },
  "fonts": {
    "ui": {
      "family": "\"Timeless Grotesk\", sans-serif",
      "weights": {
        "heavy": 600,
        "medium": 500,
        "regular": 400
      }
    },
    "brand": {
      "family": "\"Timeless Grotesk\", sans-serif",
      "weights": {
        "heavy": 600,
        "medium": 500,
        "regular": 400
      }
    },
    "editorial": {
      "family": "\"Timeless Grotesk\", sans-serif",
      "weights": {
        "heavy": 600,
        "medium": 500,
        "regular": 400
      }
    },
    "data": {
      "family": "\"Timeless Grotesk\", sans-serif",
      "weights": {
        "heavy": 600,
        "medium": 500,
        "regular": 400
      }
    }
  },
  "border": {
    "l": 0,
    "m": 0,
    "s": 0,
    "none": 0
  },
  "radius": {
    "l": 13,
    "m": 9,
    "s": 5,
    "xl": 22,
    "xs": 2,
    "full": 9999,
    "zero": 0
  },
  "shadows": {
    "l": {
      "x": 0,
      "y": 16,
      "blur": 48,
      "color": {
        "dark": "neutral-1",
        "light": "neutral-10"
      },
      "spread": 0,
      "opacity": 0
    },
    "m": {
      "x": 0,
      "y": 8,
      "blur": 24,
      "color": {
        "dark": "neutral-1",
        "light": "neutral-10"
      },
      "spread": 0,
      "opacity": 12
    },
    "s": {
      "x": 0,
      "y": 2,
      "blur": 4,
      "color": {
        "dark": "neutral-1",
        "light": "neutral-10"
      },
      "spread": 0,
      "opacity": 0
    }
  },
  "spacing": {
    "l": 17,
    "m": 11,
    "s": 8,
    "xl": 22,
    "xs": 6,
    "xxl": 34,
    "xxs": 3,
    "zero": 0
  },
  "animation": {
    "large": {
      "easing": [
        0.22,
        1,
        0.36,
        1
      ],
      "duration": 360
    },
    "easing": [
      0.16,
      1,
      0.3,
      1
    ],
    "duration": 200,
    "popupScale": 0.96,
    "pressDistance": 1
  },
  "iconStyle": "outlined",
  "iconFamily": "Lucide",
  "neutralTone": "cool",
  "buttonRadius": "s",
  "colorEmphasis": 12,
  "primaryForeground": {
    "dark": "neutral-2",
    "light": "neutral-2"
  },
  "primaryActionColor": "neutral-10"
}
```

## light CSS variables

Define these in the app’s existing theme scope for this mode. Keep component styles linked to the variables.

| Variable | Value |
| --- | --- |
| `--theme-name` | Untitled |
| `--theme-icon-family` | Lucide |
| `--theme-icon-style` | outlined |
| `--toolbar-divider-bleed` | 0 |
| `--focus-ring-outline` | initial |
| `--icon-stroke-width` | 2 |
| `--icon-light-display` | none |
| `--icon-regular-display` | inline |
| `--icon-bold-display` | none |
| `--motion-duration` | 200ms |
| `--motion-easing` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--motion-type` | easing |
| `--motion-visual-duration` | 0.2 |
| `--motion-bounce` | 0.2 |
| `--motion-enabled` | 1 |
| `--motion-small-iterations` | infinite |
| `--motion-large-duration` | 360ms |
| `--motion-large-easing` | cubic-bezier(0.22, 1, 0.36, 1) |
| `--motion-large-type` | easing |
| `--motion-large-visual-duration` | 0.36 |
| `--motion-large-bounce` | 0.2 |
| `--motion-large-iterations` | infinite |
| `--motion-popup-scale` | 0.96 |
| `--motion-press-distance` | 1px |
| `--option-badge-background` | #e5e7eb |
| `--option-badge-foreground` | #000000 |
| `--navigation-active-foreground` | #000000 |
| `--emphasis-chart-fill` | #fc032d33 |
| `--emphasis-balance-background` | #c8ced5 |
| `--emphasis-rewards-background` | #f3f4f6 |
| `--emphasis-icon-background` | #f3f4f6 |
| `--emphasis-icon-foreground` | #000000 |
| `--emphasis-type-background` | #f3f4f6 |
| `--emphasis-type-foreground` | #000000 |
| `--navigation-active-background` | #e5e7eb |
| `--surface-raised-image` | none |
| `--surface-raised-shadow` | 0 0 0 0 transparent |
| `--surface-recessed-image` | none |
| `--surface-recessed-shadow` | 0 0 0 0 transparent |
| `--space-zero` | 0px |
| `--space-xxs` | 3px |
| `--space-xs` | 6px |
| `--space-s` | 8px |
| `--space-m` | 11px |
| `--space-l` | 17px |
| `--space-xl` | 22px |
| `--space-xxl` | 34px |
| `--size-xxs` | 9px |
| `--line-xxs` | 12px |
| `--letter-spacing-xxs` | 0em |
| `--size-xs` | 11px |
| `--line-xs` | 14px |
| `--letter-spacing-xs` | 0em |
| `--size-s` | 12px |
| `--line-s` | 18px |
| `--letter-spacing-s` | 0em |
| `--size-m` | 14px |
| `--line-m` | 21px |
| `--letter-spacing-m` | 0em |
| `--size-l` | 21px |
| `--line-l` | 28px |
| `--letter-spacing-l` | 0em |
| `--size-xl` | 32px |
| `--line-xl` | 35px |
| `--letter-spacing-xl` | 0em |
| `--size-xxl` | 42px |
| `--line-xxl` | 46px |
| `--letter-spacing-xxl` | 0em |
| `--radius-zero` | 0px |
| `--radius-xs` | 2px |
| `--radius-s` | 5px |
| `--radius-m` | 9px |
| `--radius-l` | 13px |
| `--radius-xl` | 22px |
| `--radius-full` | 9999px |
| `--border-none` | 0px |
| `--border-s` | 0px |
| `--border-m` | 0px |
| `--border-l` | 0px |
| `--border-default-color` | #e5e7eb33 |
| `--border-shadow-none` | 0 0 0 0 transparent |
| `--border-shadow-s` | 0 0 0 0 transparent |
| `--border-shadow-m` | 0 0 0 0 transparent |
| `--border-shadow-l` | 0 0 0 0 transparent |
| `--font-ui` | "Timeless Grotesk", sans-serif |
| `--weight-ui-regular` | 400 |
| `--weight-ui-medium` | 500 |
| `--weight-ui-heavy` | 600 |
| `--font-brand` | "Timeless Grotesk", sans-serif |
| `--weight-brand-regular` | 400 |
| `--weight-brand-medium` | 500 |
| `--weight-brand-heavy` | 600 |
| `--font-editorial` | "Timeless Grotesk", sans-serif |
| `--weight-editorial-regular` | 400 |
| `--weight-editorial-medium` | 500 |
| `--weight-editorial-heavy` | 600 |
| `--font-data` | "Timeless Grotesk", sans-serif |
| `--weight-data-regular` | 400 |
| `--weight-data-medium` | 500 |
| `--weight-data-heavy` | 600 |
| `--color-none` | transparent |
| `--color-1` | #fc032d |
| `--color-1-transparent` | #fc032d33 |
| `--color-2` | #ffc5ce |
| `--color-2-transparent` | #ffc5ce33 |
| `--color-3` | #153d85 |
| `--color-3-transparent` | #153d8533 |
| `--color-4` | #ffd7ad |
| `--color-4-transparent` | #ffd7ad33 |
| `--neutral-1` | #ffffff |
| `--neutral-1-transparent` | #ffffff33 |
| `--neutral-2` | #fbfbfc |
| `--neutral-2-transparent` | #fbfbfc33 |
| `--neutral-3` | #f3f4f6 |
| `--neutral-3-transparent` | #f3f4f633 |
| `--neutral-4` | #e5e7eb |
| `--neutral-4-transparent` | #e5e7eb33 |
| `--neutral-5` | #c8ced5 |
| `--neutral-5-transparent` | #c8ced533 |
| `--neutral-6` | #9ca2a9 |
| `--neutral-6-transparent` | #9ca2a933 |
| `--neutral-7` | #787e84 |
| `--neutral-7-transparent` | #787e8433 |
| `--neutral-8` | #51565c |
| `--neutral-8-transparent` | #51565c33 |
| `--neutral-9` | #2f3439 |
| `--neutral-9-transparent` | #2f343933 |
| `--neutral-10` | #000000 |
| `--neutral-10-transparent` | #00000033 |
| `--success` | #00906c |
| `--success-transparent` | #00906c33 |
| `--warning` | #ffea00 |
| `--warning-transparent` | #ffea0033 |
| `--error` | #fc032d |
| `--error-transparent` | #fc032d33 |
| `--shadow-none` | none |
| `--shadow-s` | 0px 2px 4px 0px #00000000 |
| `--shadow-m` | 0px 2px 6px 0px #0000000d, 0px 8px 24px 0px #00000013 |
| `--shadow-l` | 0px 16px 48px 0px #00000000 |
| `--cte-canvas` | #ffffff |
| `--cte-surface` | #fbfbfc |
| `--cte-surface-muted` | #f3f4f6 |
| `--cte-text` | #000000 |
| `--cte-text-muted` | #787e84 |
| `--cte-border` | #e5e7eb33 |
| `--cte-accent` | #fc032d |
| `--cte-accent-text` | #fbfbfc |
| `--cte-danger` | #fc032d |
| `--cte-focus` | #fc032d |
| `--cte-font` | "Timeless Grotesk", sans-serif |
| `--cte-font-size` | 12px |
| `--cte-font-weight` | 400 |
| `--cte-line-height` | 18px |
| `--cte-letter-spacing` | 0em |
| `--cte-detail-font-size` | 11px |
| `--cte-detail-line-height` | 14px |
| `--cte-detail-letter-spacing` | 0em |

## dark CSS variables

Define these in the app’s existing theme scope for this mode. Keep component styles linked to the variables.

| Variable | Value |
| --- | --- |
| `--theme-name` | Untitled |
| `--theme-icon-family` | Lucide |
| `--theme-icon-style` | outlined |
| `--toolbar-divider-bleed` | 0 |
| `--focus-ring-outline` | initial |
| `--icon-stroke-width` | 2 |
| `--icon-light-display` | none |
| `--icon-regular-display` | inline |
| `--icon-bold-display` | none |
| `--motion-duration` | 200ms |
| `--motion-easing` | cubic-bezier(0.16, 1, 0.3, 1) |
| `--motion-type` | easing |
| `--motion-visual-duration` | 0.2 |
| `--motion-bounce` | 0.2 |
| `--motion-enabled` | 1 |
| `--motion-small-iterations` | infinite |
| `--motion-large-duration` | 360ms |
| `--motion-large-easing` | cubic-bezier(0.22, 1, 0.36, 1) |
| `--motion-large-type` | easing |
| `--motion-large-visual-duration` | 0.36 |
| `--motion-large-bounce` | 0.2 |
| `--motion-large-iterations` | infinite |
| `--motion-popup-scale` | 0.96 |
| `--motion-press-distance` | 1px |
| `--option-badge-background` | #393e43 |
| `--option-badge-foreground` | #ffffff |
| `--navigation-active-foreground` | #ffffff |
| `--emphasis-chart-fill` | #fc032d33 |
| `--emphasis-balance-background` | #52575d |
| `--emphasis-rewards-background` | #272b31 |
| `--emphasis-icon-background` | #272b31 |
| `--emphasis-icon-foreground` | #ffffff |
| `--emphasis-type-background` | #272b31 |
| `--emphasis-type-foreground` | #ffffff |
| `--navigation-active-background` | #393e43 |
| `--surface-raised-image` | none |
| `--surface-raised-shadow` | 0 0 0 0 transparent |
| `--surface-recessed-image` | none |
| `--surface-recessed-shadow` | 0 0 0 0 transparent |
| `--space-zero` | 0px |
| `--space-xxs` | 3px |
| `--space-xs` | 6px |
| `--space-s` | 8px |
| `--space-m` | 11px |
| `--space-l` | 17px |
| `--space-xl` | 22px |
| `--space-xxl` | 34px |
| `--size-xxs` | 9px |
| `--line-xxs` | 12px |
| `--letter-spacing-xxs` | 0em |
| `--size-xs` | 11px |
| `--line-xs` | 14px |
| `--letter-spacing-xs` | 0em |
| `--size-s` | 12px |
| `--line-s` | 18px |
| `--letter-spacing-s` | 0em |
| `--size-m` | 14px |
| `--line-m` | 21px |
| `--letter-spacing-m` | 0em |
| `--size-l` | 21px |
| `--line-l` | 28px |
| `--letter-spacing-l` | 0em |
| `--size-xl` | 32px |
| `--line-xl` | 35px |
| `--letter-spacing-xl` | 0em |
| `--size-xxl` | 42px |
| `--line-xxl` | 46px |
| `--letter-spacing-xxl` | 0em |
| `--radius-zero` | 0px |
| `--radius-xs` | 2px |
| `--radius-s` | 5px |
| `--radius-m` | 9px |
| `--radius-l` | 13px |
| `--radius-xl` | 22px |
| `--radius-full` | 9999px |
| `--border-none` | 0px |
| `--border-s` | 0px |
| `--border-m` | 0px |
| `--border-l` | 0px |
| `--border-default-color` | #393e4333 |
| `--border-shadow-none` | 0 0 0 0 transparent |
| `--border-shadow-s` | 0 0 0 0 transparent |
| `--border-shadow-m` | 0 0 0 0 transparent |
| `--border-shadow-l` | 0 0 0 0 transparent |
| `--font-ui` | "Timeless Grotesk", sans-serif |
| `--weight-ui-regular` | 400 |
| `--weight-ui-medium` | 500 |
| `--weight-ui-heavy` | 600 |
| `--font-brand` | "Timeless Grotesk", sans-serif |
| `--weight-brand-regular` | 400 |
| `--weight-brand-medium` | 500 |
| `--weight-brand-heavy` | 600 |
| `--font-editorial` | "Timeless Grotesk", sans-serif |
| `--weight-editorial-regular` | 400 |
| `--weight-editorial-medium` | 500 |
| `--weight-editorial-heavy` | 600 |
| `--font-data` | "Timeless Grotesk", sans-serif |
| `--weight-data-regular` | 400 |
| `--weight-data-medium` | 500 |
| `--weight-data-heavy` | 600 |
| `--color-none` | transparent |
| `--color-1` | #fc032d |
| `--color-1-transparent` | #fc032d33 |
| `--color-2` | #ffc5ce |
| `--color-2-transparent` | #ffc5ce33 |
| `--color-3` | #153d85 |
| `--color-3-transparent` | #153d8533 |
| `--color-4` | #ffd7ad |
| `--color-4-transparent` | #ffd7ad33 |
| `--neutral-1` | #000000 |
| `--neutral-1-transparent` | #00000033 |
| `--neutral-2` | #1c2026 |
| `--neutral-2-transparent` | #1c202633 |
| `--neutral-3` | #272b31 |
| `--neutral-3-transparent` | #272b3133 |
| `--neutral-4` | #393e43 |
| `--neutral-4-transparent` | #393e4333 |
| `--neutral-5` | #52575d |
| `--neutral-5-transparent` | #52575d33 |
| `--neutral-6` | #7e848a |
| `--neutral-6-transparent` | #7e848a33 |
| `--neutral-7` | #a6acb3 |
| `--neutral-7-transparent` | #a6acb333 |
| `--neutral-8` | #cad0d7 |
| `--neutral-8-transparent` | #cad0d733 |
| `--neutral-9` | #f3f4f6 |
| `--neutral-9-transparent` | #f3f4f633 |
| `--neutral-10` | #ffffff |
| `--neutral-10-transparent` | #ffffff33 |
| `--success` | #00906c |
| `--success-transparent` | #00906c33 |
| `--warning` | #ffea00 |
| `--warning-transparent` | #ffea0033 |
| `--error` | #fc032d |
| `--error-transparent` | #fc032d33 |
| `--shadow-none` | none |
| `--shadow-s` | 0px 2px 4px 0px #00000000 |
| `--shadow-m` | 0px 2px 6px 0px #0000000d, 0px 8px 24px 0px #00000013 |
| `--shadow-l` | 0px 16px 48px 0px #00000000 |
| `--cte-canvas` | #000000 |
| `--cte-surface` | #1c2026 |
| `--cte-surface-muted` | #272b31 |
| `--cte-text` | #ffffff |
| `--cte-text-muted` | #a6acb3 |
| `--cte-border` | #393e4333 |
| `--cte-accent` | #fc032d |
| `--cte-accent-text` | #1c2026 |
| `--cte-danger` | #fc032d |
| `--cte-focus` | #fc032d |
| `--cte-font` | "Timeless Grotesk", sans-serif |
| `--cte-font-size` | 12px |
| `--cte-font-weight` | 400 |
| `--cte-line-height` | 18px |
| `--cte-letter-spacing` | 0em |
| `--cte-detail-font-size` | 11px |
| `--cte-detail-line-height` | 14px |
| `--cte-detail-letter-spacing` | 0em |

## Authored component assignments

These are project edits. The [component reference](untitled-components.md) includes the effective assignments with defaults and shared parts resolved.

```json
{
  "componentTokens": {
    "button:ghost:rest": {
      "paddingX": "l",
      "paddingTop": "s",
      "paddingBottom": "s"
    },
    "button:danger:rest": {
      "paddingX": "l",
      "paddingTop": "s",
      "paddingBottom": "s"
    },
    "input:default:rest": {
      "paddingX": "m",
      "background": "neutral-3",
      "paddingTop": "s",
      "paddingBottom": "s"
    },
    "button:outline:rest": {
      "paddingX": "l",
      "paddingTop": "s",
      "paddingBottom": "s"
    },
    "button:primary:rest": {
      "paddingX": "l",
      "paddingTop": "s",
      "paddingBottom": "s"
    },
    "select:default:rest": {
      "paddingX": "m",
      "background": "neutral-3",
      "paddingTop": "s",
      "paddingBottom": "s"
    },
    "button:secondary:rest": {
      "paddingX": "l",
      "paddingTop": "s",
      "paddingBottom": "s"
    },
    "combobox:default:rest": {
      "paddingX": "m",
      "background": "neutral-3",
      "paddingTop": "s",
      "paddingBottom": "s"
    },
    "menu:default:part:option:rest": {
      "paddingX": "xs",
      "paddingTop": "xs",
      "paddingLeft": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs"
    },
    "slider:default:part:thumb:rest": {
      "controlSize": "l"
    },
    "slider:default:part:track:rest": {
      "controlSize": "xl"
    },
    "switch:default:part:control:rest": {
      "controlSize": "xl"
    },
    "combobox:default:part:option:rest": {
      "paddingX": "xs",
      "paddingTop": "xs",
      "paddingLeft": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs"
    },
    "menu:default:part:option:selected": {
      "paddingX": "xs",
      "paddingTop": "xs",
      "paddingLeft": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs"
    },
    "otp-field:default:part:input:rest": {
      "paddingX": "s",
      "paddingTop": "xs",
      "paddingLeft": "s",
      "paddingRight": "s",
      "paddingBottom": "xs"
    },
    "checkbox:default:part:control:rest": {
      "controlSize": "l"
    },
    "autocomplete:default:part:input:rest": {
      "paddingX": "s",
      "paddingTop": "s",
      "paddingLeft": "s",
      "paddingRight": "s",
      "paddingBottom": "s"
    },
    "autocomplete:default:part:option:rest": {
      "paddingX": "xs",
      "paddingTop": "xs",
      "paddingLeft": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs"
    },
    "combobox:default:part:option:selected": {
      "paddingX": "xs",
      "paddingTop": "xs",
      "paddingLeft": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs"
    },
    "autocomplete:default:part:popover:rest": {
      "radius": "s"
    },
    "autocomplete:default:part:option:selected": {
      "paddingX": "xs",
      "paddingTop": "xs",
      "paddingLeft": "xs",
      "paddingRight": "xs",
      "paddingBottom": "xs"
    }
  },
  "componentVariants": {}
}
```
