"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  X,
  FileText,
  Image,
  File,
  Loader2,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { saveOrderFiles } from "@/actions/files";

// Maximum file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type FileStatus = "pending" | "uploading" | "done" | "error";

interface FileQueueItem {
  id: string;
  file: File;
  preview?: string;
  status: FileStatus;
  progress: number;
  error?: string;
  uploadResult?: {
    name: string;
    url: string;
    key: string;
    size: number;
    type: string;
  };
}

interface FileUploadDialogProps {
  orderId: string;
  milestoneId?: string;
  trigger?: React.ReactNode;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type === "application/pdf") return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function FileUploadDialog({ orderId, milestoneId, trigger }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isClientVisible, setIsClientVisible] = useState(false);
  const [category, setCategory] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const dragCounter = useRef(0);

  // Cleanup previews on unmount or dialog close
  useEffect(() => {
    return () => {
      fileQueue.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const newItems: FileQueueItem[] = files.map((file) => {
      const isTooLarge = file.size > MAX_FILE_SIZE;
      return {
        id: generateId(),
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined,
        status: isTooLarge ? ("error" as FileStatus) : ("pending" as FileStatus),
        progress: 0,
        error: isTooLarge
          ? `Файл превышает максимальный размер (${formatFileSize(MAX_FILE_SIZE)})`
          : undefined,
      };
    });
    setFileQueue((prev) => [...prev, ...newItems]);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      addFiles(files);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles]
  );

  const removeFile = useCallback((id: string) => {
    // Abort upload if in progress
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    setFileQueue((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        addFiles(files);
      }
    },
    [addFiles]
  );

  const uploadSingleFile = useCallback(
    async (item: FileQueueItem): Promise<FileQueueItem> => {
      const controller = new AbortController();
      abortControllers.current.set(item.id, controller);

      // Update status to uploading
      setFileQueue((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "uploading" as FileStatus, progress: 0 } : f
        )
      );

      try {
        const formData = new FormData();
        formData.append("files", item.file);
        formData.append("orderId", orderId);

        // Use XMLHttpRequest for progress tracking
        const result = await new Promise<{
          name: string;
          url: string;
          key: string;
          size: number;
          type: string;
        }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setFileQueue((prev) =>
                prev.map((f) =>
                  f.id === item.id ? { ...f, progress: percent } : f
                )
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.files && response.files.length > 0) {
                  resolve(response.files[0]);
                } else {
                  reject(new Error("Некорректный ответ сервера"));
                }
              } catch {
                reject(new Error("Ошибка обработки ответа"));
              }
            } else {
              reject(new Error(`Ошибка загрузки (${xhr.status})`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Сетевая ошибка"));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Загрузка отменена"));
          });

          controller.signal.addEventListener("abort", () => {
            xhr.abort();
          });

          xhr.open("POST", "/api/files/upload");
          xhr.send(formData);
        });

        abortControllers.current.delete(item.id);

        // Update to done
        setFileQueue((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: "done" as FileStatus,
                  progress: 100,
                  uploadResult: result,
                }
              : f
          )
        );

        return {
          ...item,
          status: "done" as FileStatus,
          progress: 100,
          uploadResult: result,
        };
      } catch (error: any) {
        abortControllers.current.delete(item.id);

        const errorMessage =
          error?.message === "Загрузка отменена"
            ? "Загрузка отменена"
            : "Ошибка загрузки файла";

        setFileQueue((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "error" as FileStatus, error: errorMessage }
              : f
          )
        );

        return { ...item, status: "error" as FileStatus, error: errorMessage };
      }
    },
    [orderId]
  );

  const handleUpload = async () => {
    const filesToUpload = fileQueue.filter((f) => f.status === "pending");
    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    const results: FileQueueItem[] = [];

    // Upload files sequentially for clearer progress
    for (const item of filesToUpload) {
      const result = await uploadSingleFile(item);
      results.push(result);
    }

    // Collect successfully uploaded files and save to DB
    const successfulUploads = results.filter(
      (r) => r.status === "done" && r.uploadResult
    );

    if (successfulUploads.length > 0) {
      try {
        await saveOrderFiles(
          orderId,
          successfulUploads.map((f) => ({
            name: f.uploadResult!.name,
            url: f.uploadResult!.url,
            key: f.uploadResult!.key,
            size: f.uploadResult!.size,
            type: f.uploadResult!.type,
          })),
          { category: category || undefined, isClientVisible, milestoneId }
        );
      } catch (error) {
        console.error("Failed to save file records:", error);
      }
    }

    setIsUploading(false);

    // If all uploaded successfully, close after a short delay
    const allDone = results.every((r) => r.status === "done");
    if (allDone && results.length > 0) {
      setTimeout(() => {
        setOpen(false);
        resetState();
      }, 800);
    }
  };

  const resetState = useCallback(() => {
    fileQueue.forEach((item) => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
    setFileQueue([]);
    setCategory("");
    setIsClientVisible(false);
  }, [fileQueue]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) {
        // Abort any in-progress uploads
        abortControllers.current.forEach((controller) => controller.abort());
        abortControllers.current.clear();
        resetState();
        setIsUploading(false);
      }
    },
    [resetState]
  );

  const pendingCount = fileQueue.filter((f) => f.status === "pending").length;
  const doneCount = fileQueue.filter((f) => f.status === "done").length;
  const errorCount = fileQueue.filter((f) => f.status === "error").length;
  const allDone =
    fileQueue.length > 0 && fileQueue.every((f) => f.status === "done");

  // Determine the visual state of the dialog
  const dialogState: "idle" | "dragging" | "uploading" | "complete" | "error" =
    allDone
      ? "complete"
      : isUploading
        ? "uploading"
        : isDragging
          ? "dragging"
          : errorCount > 0 && doneCount === 0 && pendingCount === 0
            ? "error"
            : "idle";

  function renderStatusIcon(item: FileQueueItem) {
    switch (item.status) {
      case "pending":
        return null;
      case "uploading":
        return <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />;
      case "done":
        return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive shrink-0" />;
    }
  }

  function renderStatusBadge(item: FileQueueItem) {
    switch (item.status) {
      case "pending":
        return (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Ожидание
          </Badge>
        );
      case "uploading":
        return (
          <Badge variant="default" className="text-[10px] px-1.5 py-0">
            Загрузка
          </Badge>
        );
      case "done":
        return (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          >
            Готово
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            Ошибка
          </Badge>
        );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Загрузить
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Загрузка файлов</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drag & Drop zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
              ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : allDone
                    ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                    : "border-muted-foreground/25 hover:border-primary/50"
              }
            `}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {isDragging ? (
              <>
                <Upload className="w-10 h-10 mx-auto mb-3 text-primary animate-bounce" />
                <p className="text-sm font-medium text-primary">
                  Отпустите файлы для загрузки
                </p>
              </>
            ) : allDone ? (
              <>
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Все файлы загружены
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Перетащите файлы сюда или нажмите для выбора
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Изображения, PDF, документы, таблицы, архивы (макс.{" "}
                  {formatFileSize(MAX_FILE_SIZE)})
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
            />
          </div>

          {/* Upload queue */}
          {fileQueue.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {fileQueue.map((item) => {
                const Icon = getFileIcon(item.file.type);
                return (
                  <div
                    key={item.id}
                    className={`
                      flex items-start gap-3 p-2.5 rounded-lg border transition-colors
                      ${
                        item.status === "error"
                          ? "border-destructive/40 bg-destructive/5"
                          : item.status === "done"
                            ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                            : "border-border"
                      }
                    `}
                  >
                    {/* File icon / thumbnail */}
                    <div className="shrink-0">
                      {item.preview ? (
                        <img
                          src={item.preview}
                          alt=""
                          className="w-9 h-9 rounded object-cover"
                        />
                      ) : (
                        <Icon className="w-9 h-9 text-muted-foreground p-1" />
                      )}
                    </div>

                    {/* File details + progress */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm truncate flex-1">
                          {item.file.name}
                        </p>
                        {renderStatusBadge(item)}
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.file.size)}
                        </p>
                        {renderStatusIcon(item)}
                      </div>

                      {/* Progress bar */}
                      {(item.status === "uploading" ||
                        item.status === "done") && (
                        <Progress
                          value={item.progress}
                          className="h-1.5"
                        />
                      )}

                      {/* Inline error message */}
                      {item.status === "error" && item.error && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {item.error}
                        </p>
                      )}
                    </div>

                    {/* Remove / cancel button */}
                    {item.status !== "done" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 mt-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(item.id);
                        }}
                        disabled={false}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed file thumbnails/icons preview section */}
          {doneCount > 0 && !allDone && (
            <div className="pt-1">
              <p className="text-xs text-muted-foreground mb-2">
                Загружено ({doneCount}):
              </p>
              <div className="flex flex-wrap gap-2">
                {fileQueue
                  .filter((f) => f.status === "done")
                  .map((item) => {
                    const Icon = getFileIcon(item.file.type);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                      >
                        {item.preview ? (
                          <img
                            src={item.preview}
                            alt=""
                            className="w-5 h-5 rounded object-cover"
                          />
                        ) : (
                          <Icon className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-xs text-green-700 dark:text-green-400 max-w-[100px] truncate">
                          {item.file.name}
                        </span>
                        <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Options */}
          <div className="flex items-center gap-4">
            <select
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isUploading}
            >
              <option value="">Без категории</option>
              <option value="design">Дизайн</option>
              <option value="document">Документ</option>
              <option value="contract">Контракт</option>
              <option value="reference">Референс</option>
              <option value="deliverable">Результат</option>
            </select>

            <Button
              variant={isClientVisible ? "default" : "outline"}
              size="sm"
              onClick={() => setIsClientVisible(!isClientVisible)}
              className="gap-1.5 whitespace-nowrap"
              disabled={isUploading}
            >
              {isClientVisible ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              {isClientVisible ? "Видно клиенту" : "Скрыто"}
            </Button>
          </div>

          {/* Overall progress summary */}
          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                Загрузка файлов... ({doneCount} из{" "}
                {fileQueue.filter((f) => f.status !== "error").length})
              </span>
            </div>
          )}

          {allDone && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {doneCount === 1
                  ? "Файл успешно загружен"
                  : `Все файлы загружены (${doneCount})`}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {fileQueue.length === 0
                ? "Нет файлов"
                : `${fileQueue.length} файл(ов)`}
              {errorCount > 0 && (
                <span className="text-destructive ml-1">
                  ({errorCount} с ошибкой)
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isUploading}
              >
                {allDone ? "Закрыть" : "Отмена"}
              </Button>
              <Button
                disabled={pendingCount === 0 || isUploading}
                onClick={handleUpload}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploading
                  ? "Загрузка..."
                  : pendingCount > 0
                    ? `Загрузить (${pendingCount})`
                    : "Загрузить"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
