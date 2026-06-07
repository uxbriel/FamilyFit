import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta cálida inspirada en la bandera peruana, suave para móvil
        brand: {
          50: "#fff1f1",
          100: "#ffdede",
          500: "#d91e2a",
          600: "#b71722",
          700: "#8f111a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
