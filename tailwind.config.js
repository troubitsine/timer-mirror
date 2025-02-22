/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        stroke: {
          "black-5": "rgba(0, 0, 0, 0.05)",
          "black-10": "rgba(0, 0, 0, 0.1)",
          "black-20": "rgba(0, 0, 0, 0.2)",
          "white-5": "rgba(255, 255, 255, 0.05)",
          "white-10": "rgba(255, 255, 255, 0.1)",
          "white-20": "rgba(255, 255, 255, 0.2)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities }) {
      const createStrokeUtilities = (color, colorName) => {
        const sizes = {
          xs: "0.5px",
          sm: "1px",
          lg: "2px",
        };

        const opacities = {
          5: "0.05",
          10: "0.1",
          20: "0.2",
        };

        let utilities = {};

        Object.entries(sizes).forEach(([sizeName, size]) => {
          Object.entries(opacities).forEach(([opacity, value]) => {
            utilities[`.inner-stroke-${colorName}-${opacity}-${sizeName}`] = {
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: "0",
                border: `${size} solid ${color}`,
                opacity: value,
                pointerEvents: "none",
                zIndex: "1",
                borderRadius: "inherit",
              },
            };
          });
        });

        return utilities;
      };

      const utilities = {
        ...createStrokeUtilities("rgb(0, 0, 0)", "black"),
        ...createStrokeUtilities("rgb(255, 255, 255)", "white"),
      };

      addUtilities(utilities);
    },
  ],
};
