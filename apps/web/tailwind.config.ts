import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem'
  		},
  		fontFamily: {
  			sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  			display: ['var(--font-display)', 'system-ui', 'sans-serif']
  		},
  		fontSize: {
  			'2xs': '0.625rem',
  			'3xl': '1.75rem'
  		},
  		colors: {
  			nexus: {
  				blue: {
  					50: '#eff6ff',
  					100: '#dbeafe',
  					200: '#bfdbfe',
  					300: '#93c5fd',
  					400: '#60a5fa',
  					500: '#3b82f6',
  					600: '#2563eb',
  					700: '#1d4ed8',
  					800: '#1e40af',
  					900: '#1e3a8a',
  					950: '#172554'
  				},
  				green: {
  					50: '#f0fdf4',
  					100: '#dcfce7',
  					200: '#bbf7d0',
  					300: '#86efac',
  					400: '#4ade80',
  					500: '#22c55e',
  					600: '#16a34a',
  					700: '#15803d',
  					800: '#166534',
  					900: '#14532d',
  					950: '#052e16'
  				},
  				red: {
  					50: '#fef2f2',
  					100: '#fee2e2',
  					200: '#fecaca',
  					300: '#fca5a5',
  					400: '#f87171',
  					500: '#ef4444',
  					600: '#dc2626',
  					700: '#b91c1c',
  					800: '#991b1b',
  					900: '#7f1d1d',
  					950: '#450a0a'
  				}
  			},
  			success: 'hsl(var(--success))',
  			warning: 'hsl(var(--warning))',
  			danger: 'hsl(var(--danger))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
