import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, SlidersVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { JSX, ReactNode, useMemo, useState } from "react";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import ExportOptions from "@/components/ui/exportOptions";
import { cn } from "@/lib/utils";
import { exportData } from "@/lib/export";
import { toJS } from "mobx";

export type SortDirection = "asc" | "desc" | null;

export type CustomTableColumn<T> = {
    header: ReactNode;
    accessor?: keyof T;
    cell?: (row: T, rowIndex: number) => ReactNode;
    className?: string;
    sortable?: boolean;
    sortFn?: (a: T, b: T) => number;
};

export type CustomTableProps<T extends object> = {
    columns: CustomTableColumn<T>[];
    data: T[];
    tableClassName?: `${string}`;
    headerClassName?: string;
    bodyClassName?: string;
    rowClassName?: (row: T, rowIndex: number) => string;
    cellClassName?: (col: CustomTableColumn<T>, row: T, rowIndex: number) => string;
    emptyContent?: ReactNode;
    // Pagination
    usePagination?: boolean;
    page?: number;
    onPageChange?: (page: number) => void;
    rowsPerPage?: number;
    onRowsPerPageChange?: (rows: number) => void;
    totalRows?: number;
    rowsPerPageOptions?: number[];
    showRowsSelector?: boolean;
    exportOptions?: {
        title: string;
        file_name: string;
        header_title: string;
        exportFormat?: "all" | "excel-only";
    }
    hasExport?: boolean;
    hasOverlayActions?: boolean;
    overlayActions?: JSX.Element;
    // Sorting
    enableSorting?: boolean;
    sortColumn?: keyof T | null;
    sortDirection?: SortDirection;
    onSortChange?: (column: keyof T | null, direction: SortDirection) => void;
};

export function CustomTable<T extends object>({
    columns,
    data,
    tableClassName,
    headerClassName,
    bodyClassName,
    rowClassName,
    cellClassName,
    emptyContent,
    usePagination = false,
    page: controlledPage,
    onPageChange,
    rowsPerPage: controlledRowsPerPage,
    onRowsPerPageChange,
    totalRows: controlledTotalRows,
    rowsPerPageOptions = [5, 10, 20, 50],
    showRowsSelector = true,
    exportOptions,
    hasExport = false,
    hasOverlayActions,
    overlayActions,
    enableSorting = false,
    sortColumn: controlledSortColumn,
    sortDirection: controlledSortDirection,
    onSortChange
}: CustomTableProps<T>) {
    // Internal state for uncontrolled pagination
    const [internalPage, setInternalPage] = useState(1);
    const [internalRowsPerPage, setInternalRowsPerPage] = useState(rowsPerPageOptions[0]);
    
    // Internal state for sorting
    const [internalSortColumn, setInternalSortColumn] = useState<keyof T | null>(null);
    const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>(null);

    // Use controlled or uncontrolled pagination
    const page = controlledPage ?? internalPage;
    const rowsPerPage = controlledRowsPerPage ?? internalRowsPerPage;
    const totalRows = controlledTotalRows ?? data.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

    // Use controlled or uncontrolled sorting
    const sortColumn = controlledSortColumn ?? internalSortColumn;
    const sortDirection = controlledSortDirection ?? internalSortDirection;

    // Convert MobX observable to plain array for processing
    const plainData = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }
        try {
            // Convert MobX observables to plain JS objects
            return data.map(item => {
                try {
                    return toJS(item);
                } catch {
                    return item;
                }
            });
        } catch {
            return Array.isArray(data) ? [...data] : [];
        }
    }, [data]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!enableSorting || !sortColumn || !sortDirection) {
            return plainData;
        }

        const column = columns.find(col => col.accessor === sortColumn);
        if (!column) return plainData;

        const sorted = [...plainData].sort((a, b) => {
            if (column.sortFn) {
                return column.sortFn(a, b);
            }

            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            // Handle null/undefined
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Compare values
            if (typeof aValue === "string" && typeof bValue === "string") {
                return aValue.localeCompare(bValue);
            }
            if (typeof aValue === "number" && typeof bValue === "number") {
                return aValue - bValue;
            }
            if (aValue instanceof Date && bValue instanceof Date) {
                return aValue.getTime() - bValue.getTime();
            }

            return String(aValue).localeCompare(String(bValue));
        });

        return sortDirection === "desc" ? sorted.reverse() : sorted;
    }, [plainData, enableSorting, sortColumn, sortDirection, columns]);

    // Memoize paginated data to prevent unnecessary recalculations
    const paginatedData = useMemo(() => {
        if (sortedData.length === 0) {
            return [];
        }
        const isControlled = Boolean(onPageChange || onRowsPerPageChange || controlledTotalRows !== undefined);
        return usePagination && !isControlled
            ? sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage)
            : sortedData;
    }, [sortedData, usePagination, onPageChange, onRowsPerPageChange, controlledTotalRows, page, rowsPerPage]);

    // Handlers
    const handlePageChange = (newPage: number) => {
        if (onPageChange) onPageChange(newPage);
        else setInternalPage(newPage);
    };
    const handleRowsPerPageChange = (rows: number) => {
        if (onRowsPerPageChange) onRowsPerPageChange(rows);
        else {
            setInternalRowsPerPage(rows);
            setInternalPage(1);
        }
    };

    const handleSort = (column: CustomTableColumn<T>) => {
        if (!enableSorting || !column.sortable || !column.accessor) return;

        const columnKey = column.accessor;
        let newColumn: keyof T | null = columnKey;
        let newDirection: SortDirection = "asc";

        if (sortColumn === columnKey) {
            if (sortDirection === "asc") {
                newDirection = "desc";
            } else if (sortDirection === "desc") {
                newDirection = null;
                newColumn = null;
            }
        }

        if (onSortChange) {
            onSortChange(newColumn, newDirection);
        } else {
            setInternalSortColumn(newColumn);
            setInternalSortDirection(newDirection);
        }
    };

    // Prepare export params - convert to plain JS for export
    const exportParams = useMemo(() => {
        const plainSortedData = Array.isArray(sortedData) ? sortedData.map(item => {
            try {
                return toJS(item);
            } catch {
                return item;
            }
        }) : [];
        
        // Map data to match column headers for export
        // For each row, extract values based on column accessors or cell functions
        const exportData = plainSortedData.map((row: T) => {
            const exportRow: Record<string, unknown> = {};
            columns.forEach((col) => {
                const headerText = typeof col.header === "string" ? col.header : String(col.header);
                
                // If column has an accessor, use it to get the value
                if (col.accessor) {
                    const value = row[col.accessor];
                    // Handle nested objects/arrays
                    if (value !== null && value !== undefined) {
                        if (typeof value === "object" && !Array.isArray(value)) {
                            // For nested objects, try to extract meaningful string representation
                            if ("name" in value) {
                                exportRow[headerText] = (value as { name?: string }).name || "";
                            } else if ("firstName" in value && "lastName" in value) {
                                exportRow[headerText] = `${(value as { firstName?: string }).firstName || ""} ${(value as { lastName?: string }).lastName || ""}`.trim();
                            } else {
                                exportRow[headerText] = JSON.stringify(value);
                            }
                        } else {
                            exportRow[headerText] = value;
                        }
                    } else {
                        exportRow[headerText] = "";
                    }
                } else if (col.cell) {
                    // If column has a custom cell renderer, try to extract meaningful data
                    // For complex cells, we'll use the cell function result converted to string
                    try {
                        const cellValue = col.cell(row, 0);
                        // Extract text from React elements if possible
                        if (typeof cellValue === "string" || typeof cellValue === "number") {
                            exportRow[headerText] = cellValue;
                        } else if (cellValue && typeof cellValue === "object" && "props" in cellValue) {
                            // Try to extract text from React element
                            const reactElement = cellValue as { props?: { children?: unknown; "data-export-value"?: string } };
                            
                            // First check for data-export-value attribute
                            if (reactElement.props?.["data-export-value"]) {
                                exportRow[headerText] = reactElement.props["data-export-value"];
                            } else if (reactElement.props?.children) {
                                // Recursively extract text from nested children
                                const extractText = (children: unknown): string => {
                                    if (typeof children === "string" || typeof children === "number") {
                                        return String(children);
                                    } else if (Array.isArray(children)) {
                                        return children.map(extractText).filter(Boolean).join(" ");
                                    } else if (children && typeof children === "object" && "props" in children) {
                                        const childElement = children as { props?: { children?: unknown; "data-export-value"?: string } };
                                        if (childElement.props?.["data-export-value"]) {
                                            return childElement.props["data-export-value"];
                                        } else if (childElement.props?.children) {
                                            return extractText(childElement.props.children);
                                        }
                                    }
                                    return "";
                                };
                                exportRow[headerText] = extractText(reactElement.props.children).trim();
                            } else {
                                exportRow[headerText] = "";
                            }
                        } else {
                            exportRow[headerText] = String(cellValue || "");
                        }
                    } catch {
                        exportRow[headerText] = "";
                    }
                } else {
                    exportRow[headerText] = "";
                }
            });
            return exportRow;
        });
        
        return {
            title: exportOptions?.title ?? '',
            headerTitle: exportOptions?.header_title ?? '',
            fileName: exportOptions?.file_name ?? 'exported_data',
            columns: columns.map(col => typeof col.header === "string" ? col.header : String(col.header)),
            data: exportData,
        };
    }, [sortedData, exportOptions, columns]);

    // Custom export handler for Excel-only
    const handleExcelOnlyExport = async () => {
        await exportData({ 
            ...exportParams, 
            type: "excel",
            data: exportParams.data as Record<string, unknown>[]
        });
    };

    return (
        <div className="flex flex-col w-full">
            {/* Fixed controls at top */}
            <div className="flex justify-end gap-4 mb-4 shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 pb-2 border-b">
                {hasExport && exportOptions?.exportFormat === "excel-only" ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExcelOnlyExport}
                        className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                        <SlidersVertical className="mr-2 h-4 w-4" />
                        Export to Excel
                    </Button>
                ) : hasExport ? (
                    <ExportOptions params={exportParams as { title: string; headerTitle: string; fileName: string; columns: string[]; data: Record<string, unknown>[] }} />
                ) : null}
                {showRowsSelector && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <SlidersVertical /> Rows per page
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {rowsPerPageOptions.map((option) => (
                                <DropdownMenuItem
                                    key={option}
                                    onClick={() => handleRowsPerPageChange(option)}
                                    className={rowsPerPage === option ? "font-bold" : ""}
                                >
                                    {option}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            {/* Scrollable table container */}
            <div className="w-full overflow-x-auto">
                <div className="border rounded-md min-w-max">
                    <table
                        className={cn("w-full caption-bottom text-sm", tableClassName)}
                    >
                        <TableHeader className={headerClassName}>
                            <TableRow>
                                {columns.map((col, i) => {
                                    const isSortable = enableSorting && col.sortable && col.accessor;
                                    const isSorted = isSortable && sortColumn === col.accessor;
                                    const SortIcon = isSorted
                                        ? sortDirection === "asc"
                                            ? ArrowUp
                                            : sortDirection === "desc"
                                                ? ArrowDown
                                                : ArrowUpDown
                                        : ArrowUpDown;

                                    return (
                                        <TableHead
                                            key={i}
                                            className={cn(
                                                col.className,
                                                isSortable && "cursor-pointer select-none hover:bg-muted/50"
                                            )}
                                            onClick={() => isSortable && handleSort(col)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {col.header}
                                                {isSortable && (
                                                    <SortIcon className="h-4 w-4 opacity-50" />
                                                )}
                                            </div>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        </TableHeader>
                        <TableBody className={bodyClassName}>
                            {!paginatedData || paginatedData.length === 0 ? (
                                <TableRow key="empty-row">
                                    <TableCell colSpan={columns.length} className="text-center py-8">
                                        {emptyContent || "No data found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((row, rowIndex) => {
                                    // Use row.id if available, otherwise fallback to index
                                    const rowId = (row as Record<string, unknown>)?.id;
                                    const rowKey = rowId ? String(rowId) : `row-${rowIndex}`;
                                    
                                    // Safety check: ensure row is valid
                                    if (!row || typeof row !== 'object') {
                                        return null;
                                    }
                                    
                                    return (
                                    <TableRow key={rowKey} className={cn(rowClassName?.(row, rowIndex), 'relative group')}>
                                        {columns.map((col, colIndex) => {
                                            // Create stable key for each cell using column accessor or index
                                            const cellKey = col.accessor 
                                                ? `${rowKey}-${String(col.accessor)}` 
                                                : `${rowKey}-col-${colIndex}`;
                                            
                                            let cellContent: ReactNode = null;
                                            
                                            try {
                                                if (col.cell) {
                                                    cellContent = col.cell(row, rowIndex);
                                                } else if (col.accessor) {
                                                    cellContent = (row[col.accessor as keyof T] as ReactNode);
                                                }
                                            } catch (error) {
                                                console.warn('Error rendering cell:', error);
                                                cellContent = null;
                                            }
                                            
                                            return (
                                            <TableCell
                                                key={cellKey}
                                                className={cn(cellClassName?.(col, row, rowIndex) || col.className, hasOverlayActions && 'cursor-pointer')}
                                            >
                                                {cellContent}
                                            </TableCell>
                                            );
                                        })}
                                        {overlayActions}
                                    </TableRow>
                                    );
                                }).filter(Boolean) // Remove any null entries
                            )}
                        </TableBody>
                    </table>
                </div>
            </div>
            {/* Pagination controls */}
            {usePagination && totalPages > 1 && (
                <div className="flex items-center justify-center mt-6 shrink-0">
                    <div className="flex items-center gap-2 border rounded-md">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <div className="flex items-center">
                            {Array.from({ length: totalPages }).map((_, i) =>
                                i + 1 === 1 ||
                                    i + 1 === totalPages ||
                                    Math.abs(i + 1 - page) <= 1 ? (
                                    <Button
                                        key={i}
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                            length > 1
                                                ? i === 0
                                                    ? 'border-l border-r'
                                                    : 'border-r'
                                                : 'border-l border-r rounded-none'
                                        )}
                                        onClick={() => handlePageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </Button>
                                ) :
                                    (i === 1 && page > 4) || (i === totalPages - 2 && page < totalPages - 3) ? (
                                        <span key={i} className="px-2">...</span>
                                    ) : null
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
} 