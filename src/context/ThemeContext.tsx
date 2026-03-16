import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ThemeContextType = {
    isDarkMode: boolean;
    toggleTheme: () => void;
    theme: "dark" | "light";
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
    children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        const saved = localStorage.getItem("isDarkMode");
        return saved === "true";
    });

    const toggleTheme = () => {
        setIsDarkMode((prev) => {
            const newMode = !prev;
            localStorage.setItem("isDarkMode", String(newMode));
            return newMode;
        });
    };

    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add("dark");
        } else {
            document.body.classList.remove("dark");
        }
    }, [isDarkMode]);

    const theme: "dark" | "light" = isDarkMode ? "dark" : "light";

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
            <div>{children}</div>
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }

    return context;
}