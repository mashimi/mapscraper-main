/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#08090D",
                card: "#0F111A",
                primary: "#3b82f6",
                secondary: "#1f2937",
            },
        },
    },
    plugins: [],
}
