declare const _default: {
    content: string[];
    theme: {
        extend: {
            fontFamily: {
                sans: [string, string, string];
            };
            colors: {
                ink: {
                    950: string;
                    900: string;
                    800: string;
                    700: string;
                };
                fuel: {
                    cyan: string;
                    blue: string;
                    amber: string;
                    red: string;
                    green: string;
                };
            };
            boxShadow: {
                panel: string;
            };
            backgroundImage: {
                "dashboard-grid": string;
            };
            animation: {
                float: string;
                pulseSlow: string;
            };
            keyframes: {
                float: {
                    "0%, 100%": {
                        transform: string;
                    };
                    "50%": {
                        transform: string;
                    };
                };
            };
        };
    };
    plugins: any[];
};
export default _default;
