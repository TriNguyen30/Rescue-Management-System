import React, { createContext, useContext, useMemo, useState } from "react";

type PageContextType = {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    canGoPrevious: boolean;
    canGoNext: boolean;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setTotalItems: (total: number) => void;
    goToPage: (page: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    resetPage: () => void;
};

type PageProviderProps = {
    children: React.ReactNode;
    initialPage?: number;
    initialPageSize?: number;
    initialTotalItems?: number;
};

const PageContext = createContext<PageContextType | undefined>(undefined);

export function PageProvider({
    children,
    initialPage = 1,
    initialPageSize = 10,
    initialTotalItems = 0,
}: PageProviderProps) {
    const safeInitialPage = Math.max(1, initialPage);
    const safeInitialPageSize = Math.max(1, initialPageSize);
    const safeInitialTotalItems = Math.max(0, initialTotalItems);

    const [page, setPage] = useState<number>(safeInitialPage);
    const [pageSize, setPageSizeState] = useState<number>(safeInitialPageSize);
    const [totalItems, setTotalItemsState] = useState<number>(safeInitialTotalItems);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(totalItems / pageSize)),
        [totalItems, pageSize],
    );

    const goToPage = (nextPage: number) => {
        setPage(Math.min(Math.max(1, nextPage), totalPages));
    };

    const setPageSize = (size: number) => {
        const safeSize = Math.max(1, size);
        setPageSizeState(safeSize);
        setPage(1);
    };

    const setTotalItems = (total: number) => {
        const safeTotal = Math.max(0, total);
        setTotalItemsState(safeTotal);
    };

    const goToNextPage = () => goToPage(page + 1);
    const goToPreviousPage = () => goToPage(page - 1);
    const resetPage = () => setPage(1);

    const value = useMemo(
        () => ({
            page,
            pageSize,
            totalItems,
            totalPages,
            canGoPrevious: page > 1,
            canGoNext: page < totalPages,
            setPage,
            setPageSize,
            setTotalItems,
            goToPage,
            goToNextPage,
            goToPreviousPage,
            resetPage,
        }),
        [page, pageSize, totalItems, totalPages],
    );

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

export function usePage() {
    const ctx = useContext(PageContext);
    if (!ctx) throw new Error("usePage must be used inside PageProvider");
    return ctx;
}
