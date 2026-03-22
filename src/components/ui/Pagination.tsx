import { useMemo } from "react";
import { usePage } from "@/context/PageContext";

type PaginationProps = {
    siblingCount?: number;
    className?: string;
};

const DOTS = "...";

function createPageRange(
    currentPage: number,
    totalPages: number,
    siblingCount: number,
): Array<number | string> {
    const totalVisibleNumbers = siblingCount * 2 + 5;

    if (totalVisibleNumbers >= totalPages) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftItemCount = 3 + siblingCount * 2;
        const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, DOTS, totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightItemCount = 3 + siblingCount * 2;
        const start = totalPages - rightItemCount + 1;
        const rightRange = Array.from({ length: rightItemCount }, (_, i) => start + i);
        return [firstPageIndex, DOTS, ...rightRange];
    }

    const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i,
    );

    return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
}

export default function Pagination({
    siblingCount = 1,
    className = "",
}: PaginationProps) {
    const { page, totalPages, canGoNext, canGoPrevious, goToPage, goToNextPage, goToPreviousPage } = usePage();

    const pageItems = useMemo(
        () => createPageRange(page, totalPages, siblingCount),
        [page, totalPages, siblingCount],
    );

    if (totalPages <= 1) {
        return null;
    }

    return (
        <nav className={`flex items-center justify-center gap-2 ${className}`} aria-label="Pagination">
            <button
                type="button"
                onClick={goToPreviousPage}
                disabled={!canGoPrevious}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
                Trước
            </button>

            {pageItems.map((item, index) => {
                if (item === DOTS) {
                    return (
                        <span key={`dots-${index}`} className="px-2 text-sm text-gray-500">
                            {DOTS}
                        </span>
                    );
                }

                const pageNumber = item as number;
                const isActive = pageNumber === page;

                return (
                    <button
                        key={pageNumber}
                        type="button"
                        onClick={() => goToPage(pageNumber)}
                        className={`rounded-md border px-4 py-2 text-sm ${
                            isActive
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                    >
                        {pageNumber}
                    </button>
                );
            })}

            <button
                type="button"
                onClick={goToNextPage}
                disabled={!canGoNext}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
                Tiếp
            </button>
        </nav>
    );
}
