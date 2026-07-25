---
name: Cosmic Connect
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#cfc2d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#988ca0'
  outline-variant: '#4d4354'
  surface-tint: '#ddb8ff'
  primary: '#ddb8ff'
  on-primary: '#490080'
  primary-container: '#9333ea'
  on-primary-container: '#f6e6ff'
  inverse-primary: '#861fdd'
  secondary: '#ffc640'
  on-secondary: '#402d00'
  secondary-container: '#e3aa00'
  on-secondary-container: '#5a4100'
  tertiary: '#3cddc7'
  on-tertiary: '#003731'
  tertiary-container: '#00786b'
  on-tertiary-container: '#91ffec'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f0dbff'
  primary-fixed-dim: '#ddb8ff'
  on-primary-fixed: '#2c0051'
  on-primary-fixed-variant: '#6800b4'
  secondary-fixed: '#ffdf9f'
  secondary-fixed-dim: '#f9bd22'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#62fae3'
  tertiary-fixed-dim: '#3cddc7'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005047'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 20px
  gutter: 16px
  section-gap: 40px
  element-gap: 12px
---

## Brand & Style
The design system reflects a premium, celestial atmosphere tailored for a Turkish-speaking audience seeking deep, astrology-based connections. The brand personality is enigmatic yet sophisticated, blending the mystery of the cosmos with the clarity of modern technology.

The aesthetic utilizes **Glassmorphism** to create a sense of depth and translucency, mimicking the ethereal nature of nebulae and starlight. The emotional response should be one of wonder, exclusivity, and digital craftsmanship. High-quality background blurs and subtle neon accents ensure the UI feels expansive, like gazing into a clear night sky.

## Colors
The palette is rooted in the "Deep Space" (#0f172a) foundation, providing a high-contrast canvas for celestial accents.

- **Primary (Nebula Purple):** Used for main actions, active states, and brand-heavy elements. It represents the mystery of the cosmos.
- **Secondary (Starlight Gold):** Reserved for compatibility highlights, premium features (VIP), and star-rating metaphors.
- **Tertiary (Celestial Teal):** Used for success states and secondary data visualizations, providing a cool balance to the purple.
- **Surface:** Semi-transparent white (white/10) combined with `backdrop-blur-md` to create the signature glass effect.

## Typography
The system uses **Montserrat** for headlines to convey a bold, modern, and slightly geometric "NASA-esque" feel. **Inter** is utilized for body text and labels to ensure maximum legibility against dark, translucent backgrounds. 

All Turkish characters (ş, ğ, ç, ı, İ, ö, ü) must be rendered with full support for these weights. Headlines should utilize tighter letter-spacing to maintain a "locked-in" premium feel, while labels are slightly tracked out for a technical, precise appearance.

## Layout & Spacing
The layout follows a **Fluid Grid** model with generous safe areas to allow the background celestial gradients to breathe.

- **Mobile:** 4-column grid with 20px side margins. Elements typically stack vertically.
- **Tablet/Desktop:** 12-column grid. Glass cards should have maximum widths to prevent the "stretched" look, maintaining a centered, cinematic focus.
- **Rhythm:** Spacing follows a 4px scale. Components like cards use 24px internal padding (p-6) to maintain an airy, premium feel.

## Elevation & Depth
Depth is achieved through **Glassmorphism** rather than traditional shadows. 

1.  **Base Layer:** Deep Space solid background.
2.  **Mid Layer:** Semi-transparent surfaces (`rgba(255, 255, 255, 0.05)`) with a `backdrop-filter: blur(12px)`.
3.  **Border Layer:** 1px solid stroke (`rgba(255, 255, 255, 0.1)`) to define element edges.
4.  **Top Layer (Interactions):** Neon glows using `box-shadow` with the primary purple color, high blur (20px+), and low spread to simulate light emission from beneath the glass.

## Shapes
A **Rounded (2)** strategy is employed to balance modern tech with organic, celestial forms. Standard containers use 16px (rounded-2xl) corners. Buttons and input fields use 12px (rounded-xl) for a slightly tighter look. Compatibility indicators and profile avatars are strictly circular (rounded-full) to represent planets and orbits.

## Components

- **Glassmorphism Cards:** Use as the primary container for user profiles and zodiac details. Background: `white/10`, Border: `white/10`, Backdrop Blur: `12px`.
- **Neon-Glowing Buttons:** 
    - *Primary:* Solid Nebula Purple with a hover state that triggers a `0 0 15px #9333ea` outer glow. 
    - *Secondary:* Ghost style with Starlight Gold border and text; hover fills the background slightly.
- **Circular Progress (Uyum Oranı):** Used for astrological compatibility percentages. Features a thick `secondary-gold` stroke on a `white/10` track, centered with the percentage text.
- **Accordion Cards:** Used for "Burç Özellikleri" (Zodiac Traits). Header features a subtle chevron; expansion reveals content with a smooth fade-in and vertical slide.
- **Tiered Pricing Cards:** The "Premium" tier should feature a 1px gradient border (Purple to Gold) and a subtle, slow-pulsing background glow to differentiate it from standard tiers.
- **Input Fields:** Darker than the background (`bg-slate-950/50`) with a white/10 border. Focus state changes border to Nebula Purple with a faint glow.
- **Chips (Etiketler):** Small, rounded-full badges for interests or traits, using `white/5` background and `label-sm` typography.