export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Avenir Next"', '"Segoe UI"', "sans-serif"],
            },
            colors: {
                ink: {
                    950: "#050816",
                    900: "#0b1020",
                    800: "#121a31",
                    700: "#1a2442",
                },
                fuel: {
                    cyan: "#4DE2D1",
                    blue: "#4A9CFF",
                    amber: "#F7B955",
                    red: "#FF5D73",
                    green: "#55D89B",
                },
            },
            boxShadow: {
                panel: "0 20px 50px rgba(4, 9, 23, 0.45)",
            },
            backgroundImage: {
                "dashboard-grid": "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            },
            animation: {
                float: "float 6s ease-in-out infinite",
                pulseSlow: "pulse 3.5s ease-in-out infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-8px)" },
                },
            },
        },
    },
    plugins: [],
};
