// Tailwind config — NOC dashboard theme with semantic network-state color tokens
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base NOC dashboard palette
        noc: {
          bg:       '#0d1117',  // deep slate background
          surface:  '#161b22',  // card / panel surface
          border:   '#30363d',  // subtle borders
          muted:    '#6e7681',  // muted text / labels
          text:     '#c9d1d9',  // primary text
          bright:   '#f0f6fc',  // headings / emphasis
        },
        // Semantic network-state colors (used consistently across all mechanics)
        link: {
          up:          '#3fb950',  // green  — link up, packet delivered, correct
          congested:   '#d29922',  // amber  — congested, converging, warning
          down:        '#f85149',  // red    — link down, dropped, error
          packet:      '#58a6ff',  // blue   — moving packet accent
          idle:        '#30363d',  // grey   — inactive / idle link
        },
        // Module accent colors for sidebar / progress rings
        module: {
          a: '#58a6ff',  // Network Layer     — blue
          b: '#bc8cff',  // SDN               — purple
          c: '#79c0ff',  // Virtualization    — light blue
          d: '#ffa657',  // Congestion        — orange
          e: '#56d364',  // P4 / Dataplane    — green
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'packet':     'packet-move 1s linear infinite',
      },
    },
  },
  plugins: [],
}
