"use client";

import { useState } from "react";
import { Trash2, Eye, EyeOff, Download } from "lucide-react";
import { deleteFile, toggleFileVisibility, toggleFileDownloadable } from "@/actions/files";

interface FileItemActionsProps {
  fileId: string;
  isClientVisible: boolean;
  isClientDownloadable: boolean;
}

export function FileItemActions({ fileId, isClientVisible, isClientDownloadable }: FileItemActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Удалить этот файл?")) return;

    setLoading(true);
    await deleteFile(fileId);
    setLoading(false);
  }

  async function handleToggleVisibility(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    await toggleFileVisibility(fileId);
    setLoading(false);
  }

  async function handleToggleDownloadable(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    await toggleFileDownloadable(fileId);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={handleToggleVisibility}
        disabled={loading}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
        title={isClientVisible ? "Скрыть от клиента" : "Показать клиенту"}
      >
        {isClientVisible ? <Eye className="w-3.5 h-3.5 text-green-600" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={handleToggleDownloadable}
        disabled={loading}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
        title={isClientDownloadable ? "Запретить скачивание" : "Разрешить скачивание"}
      >
        {isClientDownloadable ? <Download className="w-3.5 h-3.5 text-blue-600" /> : <Download className="w-3.5 h-3.5 opacity-40" />}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        title="Удалить файл"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
