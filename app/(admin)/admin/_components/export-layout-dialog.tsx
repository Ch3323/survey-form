"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Download,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  applyExportLayout,
  buildAvailableExportColumns,
  buildExportHref,
  orderedExportKeys,
  type ExportColumn,
  type ExportLayout,
} from "../_lib/export-layout";
import type { SurveyQuestion, SurveyResponse } from "../_lib/types";

type ExportLayoutDialogProps = {
  responses: SurveyResponse[];
  surveyId?: string;
  surveyQuestions: SurveyQuestion[];
};

type ExportColumnRowProps = {
  column: ExportColumn;
  draggedColumnKey: string | null;
  dragOverColumnKey: string | null;
  index: number;
  isLast: boolean;
  onDragEnd: () => void;
  onDragEnter: (
    event: DragEvent<HTMLDivElement>,
    targetColumnKey: string,
  ) => void;
  onDragOver: (
    event: DragEvent<HTMLDivElement>,
    targetColumnKey: string,
  ) => void;
  onDragStart: (
    event: DragEvent<HTMLButtonElement>,
    column: ExportColumn,
  ) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onMove: (columnKey: string, direction: -1 | 1) => void;
  onToggle: (columnKey: string, enabled: boolean) => void;
};

export function ExportLayoutDialog({
  responses,
  surveyId,
  surveyQuestions,
}: ExportLayoutDialogProps) {
  const availableExportColumns = useMemo(
    () => buildAvailableExportColumns(surveyQuestions, responses),
    [responses, surveyQuestions],
  );
  const [exportLayout, setExportLayout] = useState<ExportLayout>({
    order: [],
    disabledKeys: [],
  });
  const [open, setOpen] = useState(false);
  const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null);
  const [dragOverColumnKey, setDragOverColumnKey] = useState<string | null>(
    null,
  );
  const columnListRef = useRef<HTMLDivElement>(null);
  const columnRectsRef = useRef<Map<string, DOMRect> | null>(null);
  const exportColumns = useMemo(
    () => applyExportLayout(availableExportColumns, exportLayout),
    [availableExportColumns, exportLayout],
  );
  const enabledExportKeys = exportColumns
    .filter((column) => column.enabled)
    .map((column) => column.key);
  const exportHref =
    surveyId && enabledExportKeys.length > 0
      ? buildExportHref(surveyId, enabledExportKeys)
      : "";

  useLayoutEffect(() => {
    animateColumnReorder(columnListRef.current, columnRectsRef.current);
    columnRectsRef.current = null;
  }, [exportColumns]);

  function captureColumnRects() {
    columnRectsRef.current = getColumnRects(columnListRef.current);
  }

  function toggleExportColumn(columnKey: string, enabled: boolean) {
    setExportLayout((current) => {
      const disabledKeys = new Set(current.disabledKeys);

      if (enabled) {
        disabledKeys.delete(columnKey);
      } else {
        disabledKeys.add(columnKey);
      }

      return { ...current, disabledKeys: [...disabledKeys] };
    });
  }

  function resetExportLayout() {
    captureColumnRects();
    setExportLayout({
      order: availableExportColumns.map((column) => column.key),
      disabledKeys: [],
    });
  }

  function moveExportColumn(columnKey: string, direction: -1 | 1) {
    captureColumnRects();
    setExportLayout((current) => {
      const order = orderedExportKeys(availableExportColumns, current);
      const index = order.indexOf(columnKey);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) {
        return current;
      }

      const nextOrder = [...order];
      const [key] = nextOrder.splice(index, 1);
      nextOrder.splice(nextIndex, 0, key);

      return { ...current, order: nextOrder };
    });
  }

  function reorderExportColumn(columnKey: string, targetColumnKey: string) {
    if (columnKey === targetColumnKey) {
      return;
    }

    captureColumnRects();
    setExportLayout((current) => {
      const order = orderedExportKeys(availableExportColumns, current);
      const fromIndex = order.indexOf(columnKey);
      const toIndex = order.indexOf(targetColumnKey);

      if (fromIndex < 0 || toIndex < 0) {
        return current;
      }

      const nextOrder = [...order];
      const [key] = nextOrder.splice(fromIndex, 1);
      nextOrder.splice(toIndex, 0, key);

      return { ...current, order: nextOrder };
    });
  }

  function handleColumnDragStart(
    event: DragEvent<HTMLButtonElement>,
    column: ExportColumn,
  ) {
    setDraggedColumnKey(column.key);
    setDragOverColumnKey(column.key);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", column.key);
    setColumnDragImage(event);
  }

  function handleColumnDragOver(
    event: DragEvent<HTMLDivElement>,
    targetColumnKey: string,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const columnKey =
      event.dataTransfer.getData("text/plain") || draggedColumnKey;

    setDragOverColumnKey(targetColumnKey);

    if (
      columnKey &&
      shouldReorderColumn(event, exportColumns, columnKey, targetColumnKey)
    ) {
      reorderExportColumn(columnKey, targetColumnKey);
    }
  }

  function handleColumnDragEnter(
    event: DragEvent<HTMLDivElement>,
    targetColumnKey: string,
  ) {
    event.preventDefault();
    setDragOverColumnKey(targetColumnKey);
  }

  function handleColumnDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    clearDragState();
  }

  function clearDragState() {
    setDraggedColumnKey(null);
    setDragOverColumnKey(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={!surveyId}>
          <Download />
          Download Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1.5">
              <DialogTitle>Export layout</DialogTitle>
              <DialogDescription>
                {enabledExportKeys.length} of {exportColumns.length} columns
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={resetExportLayout}
              aria-label="Reset export layout"
            >
              <RotateCcw />
            </Button>
          </div>
        </DialogHeader>
        <div
          ref={columnListRef}
          className="grid max-h-[min(480px,calc(100dvh-16rem))] gap-2 overflow-y-auto px-4"
        >
          <TooltipProvider>
            {exportColumns.map((column, index) => (
              <ExportColumnRow
                key={column.key}
                column={column}
                draggedColumnKey={draggedColumnKey}
                dragOverColumnKey={dragOverColumnKey}
                index={index}
                isLast={index === exportColumns.length - 1}
                onDragEnd={clearDragState}
                onDragEnter={handleColumnDragEnter}
                onDragOver={handleColumnDragOver}
                onDragStart={handleColumnDragStart}
                onDrop={handleColumnDrop}
                onMove={moveExportColumn}
                onToggle={toggleExportColumn}
              />
            ))}
          </TooltipProvider>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          {exportHref ? (
            <Button asChild>
              <a href={exportHref} onClick={() => setOpen(false)}>
                <Download />
                Download Excel
              </a>
            </Button>
          ) : (
            <Button type="button" disabled>
              <Download />
              Download Excel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExportColumnRow({
  column,
  draggedColumnKey,
  dragOverColumnKey,
  index,
  isLast,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onDragStart,
  onDrop,
  onMove,
  onToggle,
}: ExportColumnRowProps) {
  return (
    <div
      data-export-column-row
      data-export-column-key={column.key}
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-secondary/20 p-2 transition-all duration-150 ease-out",
        draggedColumnKey === column.key &&
          "scale-[0.99] border-primary bg-popover opacity-80 shadow-[var(--shadow-cloud-panel)] ring-2 ring-primary/25",
        dragOverColumnKey === column.key &&
          draggedColumnKey !== column.key &&
          "border-primary/60 bg-secondary/60 ring-1 ring-primary/20",
      )}
      onDragEnter={(event) => onDragEnter(event, column.key)}
      onDragOver={(event) => onDragOver(event, column.key)}
      onDrop={onDrop}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(event) => onDragStart(event, column)}
            onDragEnd={onDragEnd}
            aria-label={`Drag ${column.label} column`}
          >
            <GripVertical />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Drag to reorder</TooltipContent>
      </Tooltip>
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Checkbox
          id={`export-column-${column.key}`}
          checked={column.enabled}
          onCheckedChange={(checked) => onToggle(column.key, checked === true)}
        />
        <label
          htmlFor={`export-column-${column.key}`}
          className="min-w-0 flex-1 truncate"
        >
          {column.label}
        </label>
      </div>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onMove(column.key, -1)}
              disabled={index === 0}
              aria-label={`Move ${column.label} up`}
            >
              <ArrowUp />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move up</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onMove(column.key, 1)}
              disabled={isLast}
              aria-label={`Move ${column.label} down`}
            >
              <ArrowDown />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move down</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function animateColumnReorder(
  columnList: HTMLDivElement | null,
  previousRects: Map<string, DOMRect> | null,
) {
  if (!columnList || !previousRects) {
    return;
  }

  const rows = columnList.querySelectorAll<HTMLElement>(
    "[data-export-column-key]",
  );

  rows.forEach((row) => {
    const columnKey = row.dataset.exportColumnKey;
    const previousRect = columnKey ? previousRects.get(columnKey) : undefined;

    if (!previousRect) {
      return;
    }

    const nextRect = row.getBoundingClientRect();
    const deltaY = previousRect.top - nextRect.top;
    const deltaX = previousRect.left - nextRect.left;

    if (Math.abs(deltaY) < 1 && Math.abs(deltaX) < 1) {
      return;
    }

    row.animate(
      [
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: "translate(0, 0)" },
      ],
      {
        duration: 190,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );
  });
}

function getColumnRects(columnList: HTMLDivElement | null) {
  const rows = columnList?.querySelectorAll<HTMLElement>(
    "[data-export-column-key]",
  );

  if (!rows) {
    return null;
  }

  return new Map(
    [...rows].flatMap((row) => {
      const columnKey = row.dataset.exportColumnKey;

      return columnKey ? [[columnKey, row.getBoundingClientRect()]] : [];
    }),
  );
}

function shouldReorderColumn(
  event: DragEvent<HTMLDivElement>,
  columns: ExportColumn[],
  columnKey: string,
  targetColumnKey: string,
) {
  if (columnKey === targetColumnKey) {
    return false;
  }

  const fromIndex = columns.findIndex((column) => column.key === columnKey);
  const toIndex = columns.findIndex((column) => column.key === targetColumnKey);

  if (fromIndex < 0 || toIndex < 0) {
    return false;
  }

  const targetRect = event.currentTarget.getBoundingClientRect();
  const targetMiddleY = targetRect.top + targetRect.height / 2;

  return fromIndex < toIndex
    ? event.clientY > targetMiddleY
    : event.clientY < targetMiddleY;
}

function setColumnDragImage(event: DragEvent<HTMLButtonElement>) {
  const row = event.currentTarget.closest(
    "[data-export-column-row]",
  ) as HTMLElement | null;

  if (!row) {
    return;
  }

  const rowRect = row.getBoundingClientRect();
  const dragImage = row.cloneNode(true) as HTMLElement;

  dragImage.setAttribute("aria-hidden", "true");
  dragImage.classList.add(
    "border-primary",
    "bg-popover",
    "ring-2",
    "ring-primary/30",
  );
  dragImage.style.position = "fixed";
  dragImage.style.top = "-1000px";
  dragImage.style.left = "-1000px";
  dragImage.style.width = `${rowRect.width}px`;
  dragImage.style.borderWidth = "1px";
  dragImage.style.boxShadow = "0 18px 45px rgb(15 23 42 / 0.22)";
  dragImage.style.opacity = "1";
  dragImage.style.pointerEvents = "none";
  dragImage.style.zIndex = "9999";
  document.body.appendChild(dragImage);
  event.dataTransfer.setDragImage(
    dragImage,
    24,
    Math.max(16, rowRect.height / 2),
  );
  window.setTimeout(() => dragImage.remove(), 0);
}
