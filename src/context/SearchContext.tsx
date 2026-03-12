import React, { createContext, useContext, useMemo, useState } from "react";

type SearchContextType = {
    keyword: string;
    setKeyword: (v: string) => void;
    clear: () => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
    const [keyword, setKeyword] = useState("");

    const value = useMemo(
        () => ({
            keyword,
            setKeyword,
            clear: () => setKeyword(""),
        }),
        [keyword],
    );

    return (
        <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
    );
}

export function useSearch() {
    const ctx = useContext(SearchContext);
    if (!ctx) throw new Error("useSearch must be used inside SearchProvider");
    return ctx;
}