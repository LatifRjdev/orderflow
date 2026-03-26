"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileUp,
  Upload,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import {
  parseProgressFile,
  importTasks,
  type ParsedPhase,
  type ParsedTask,
} from "@/actions/task-import";

interface Order {
  id: string;
  title: string;
  number: string;
}

interface ImportTasksDialogProps {
  orders: Order[];
}

const STATUS_COLORS: Record<string, string> = {
  DONE: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  TODO: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  DONE: "Готово",
  IN_PROGRESS: "В работе",
  TODO: "К выполнению",
  CANCELLED: "Отменена",
};

export function ImportTasksDialog({ orders }: ImportTasksDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [rawText, setRawText] = useState("");
  const [phases, setPhases] = useState<ParsedPhase[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selection state: Set of "phaseIdx-subIdx-taskIdx" keys
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  // Collapsed phases
  const [collapsedPhases, setCollapsedPhases] = useState<Set<number>>(new Set());

  function resetState() {
    setRawText("");
    setPhases([]);
    setSelectedTasks(new Set());
    setCollapsedPhases(new Set());
    setError(null);
    setSuccess(null);
    setOrderId("");
  }

  async function handleParse() {
    if (!rawText.trim()) {
      setError("Вставьте текст progress файла");
      return;
    }
    setIsParsing(true);
    setError(null);

    try {
      const parsed = await parseProgressFile(rawText);
      if (parsed.length === 0) {
        setError("Не удалось найти задачи в тексте. Проверьте формат файла.");
        setIsParsing(false);
        return;
      }
      setPhases(parsed);

      // Select all tasks by default
      const allKeys = new Set<string>();
      parsed.forEach((phase, pi) => {
        phase.subsections.forEach((sub, si) => {
          sub.tasks.forEach((_, ti) => {
            allKeys.add(`${pi}-${si}-${ti}`);
          });
        });
      });
      setSelectedTasks(allKeys);
    } catch {
      setError("Ошибка при парсинге файла");
    } finally {
      setIsParsing(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
      setPhases([]);
      setSelectedTasks(new Set());
      setError(null);
      setSuccess(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function toggleTask(key: string) {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function togglePhase(phaseIdx: number) {
    const phase = phases[phaseIdx];
    const allKeys: string[] = [];
    phase.subsections.forEach((sub, si) => {
      sub.tasks.forEach((_, ti) => {
        allKeys.push(`${phaseIdx}-${si}-${ti}`);
      });
    });

    const allSelected = allKeys.every((k) => selectedTasks.has(k));
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allKeys.forEach((k) => next.delete(k));
      } else {
        allKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  }

  function toggleSubsection(phaseIdx: number, subIdx: number) {
    const sub = phases[phaseIdx].subsections[subIdx];
    const keys = sub.tasks.map((_, ti) => `${phaseIdx}-${subIdx}-${ti}`);
    const allSelected = keys.every((k) => selectedTasks.has(k));
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        keys.forEach((k) => next.delete(k));
      } else {
        keys.forEach((k) => next.add(k));
      }
      return next;
    });
  }

  function toggleCollapsePhase(phaseIdx: number) {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseIdx)) next.delete(phaseIdx);
      else next.add(phaseIdx);
      return next;
    });
  }

  function getPhaseCheckState(phaseIdx: number): "all" | "some" | "none" {
    const phase = phases[phaseIdx];
    const keys: string[] = [];
    phase.subsections.forEach((sub, si) => {
      sub.tasks.forEach((_, ti) => {
        keys.push(`${phaseIdx}-${si}-${ti}`);
      });
    });
    if (keys.length === 0) return "none";
    const selectedCount = keys.filter((k) => selectedTasks.has(k)).length;
    if (selectedCount === keys.length) return "all";
    if (selectedCount > 0) return "some";
    return "none";
  }

  function getSubsectionCheckState(phaseIdx: number, subIdx: number): "all" | "some" | "none" {
    const sub = phases[phaseIdx].subsections[subIdx];
    const keys = sub.tasks.map((_, ti) => `${phaseIdx}-${subIdx}-${ti}`);
    if (keys.length === 0) return "none";
    const selectedCount = keys.filter((k) => selectedTasks.has(k)).length;
    if (selectedCount === keys.length) return "all";
    if (selectedCount > 0) return "some";
    return "none";
  }

  // Count totals
  const totalTasks = phases.reduce(
    (sum, p) => sum + p.subsections.reduce((s, sub) => s + sub.tasks.length, 0),
    0
  );

  async function handleImport() {
    if (!orderId) {
      setError("Выберите заказ");
      return;
    }
    if (selectedTasks.size === 0) {
      setError("Выберите хотя бы одну задачу");
      return;
    }

    setIsImporting(true);
    setError(null);

    // Collect selected tasks
    const tasksToImport: { title: string; status: string; phase: string; subsection?: string }[] = [];
    phases.forEach((phase, pi) => {
      phase.subsections.forEach((sub, si) => {
        sub.tasks.forEach((task, ti) => {
          if (selectedTasks.has(`${pi}-${si}-${ti}`)) {
            tasksToImport.push({
              title: `${task.number} ${task.title}`,
              status: task.status,
              phase: phase.title,
              subsection: sub.title !== phase.title ? sub.title : undefined,
            });
          }
        });
      });
    });

    try {
      const result = await importTasks(orderId, tasksToImport);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(`Создано ${result.created} задач`);
        setTimeout(() => {
          setOpen(false);
          resetState();
          router.refresh();
        }, 1500);
      }
    } catch {
      setError("Произошла ошибка при импорте");
    } finally {
      setIsImporting(false);
    }
  }

  const CheckIcon = ({ state }: { state: "all" | "some" | "none" }) => {
    if (state === "all") return <CheckSquare className="w-4 h-4 text-primary" />;
    if (state === "some") return <MinusSquare className="w-4 h-4 text-primary" />;
    return <Square className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp className="w-4 h-4 mr-2" />
          Импорт
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Импорт задач из progress файла
          </DialogTitle>
          <DialogDescription>
            Вставьте содержимое progress.txt или загрузите файл. Задачи будут распарсены и добавлены к выбранному заказу.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
              {success}
            </div>
          )}

          {/* Order select */}
          <div className="space-y-2">
            <Label>Заказ (проект) *</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите заказ" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.number} — {order.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Text input or file upload */}
          {phases.length === 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Содержимое progress файла</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Загрузить файл
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Вставьте содержимое progress.txt сюда..."
                  rows={10}
                  className="font-mono text-xs"
                />
              </div>

              <Button
                onClick={handleParse}
                disabled={isParsing || !rawText.trim()}
                className="w-full"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Парсинг...
                  </>
                ) : (
                  "Распарсить"
                )}
              </Button>
            </>
          )}

          {/* Preview parsed tasks */}
          {phases.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Найдено: {totalTasks} задач в {phases.length} фазах.
                  Выбрано: <span className="font-medium text-foreground">{selectedTasks.size}</span>
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPhases([]);
                    setSelectedTasks(new Set());
                  }}
                >
                  Назад
                </Button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {phases.map((phase, pi) => {
                  const phaseState = getPhaseCheckState(pi);
                  const isCollapsed = collapsedPhases.has(pi);
                  const phaseTaskCount = phase.subsections.reduce((s, sub) => s + sub.tasks.length, 0);

                  return (
                    <div key={pi} className="border rounded-lg overflow-hidden">
                      {/* Phase header */}
                      <div
                        className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleCollapsePhase(pi)}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); togglePhase(pi); }}
                          className="flex-shrink-0"
                        >
                          <CheckIcon state={phaseState} />
                        </button>
                        <span className="font-medium text-sm flex-1">{phase.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          {phaseTaskCount}
                        </Badge>
                      </div>

                      {/* Phase content */}
                      {!isCollapsed && (
                        <div className="divide-y">
                          {phase.subsections.map((sub, si) => {
                            const subState = getSubsectionCheckState(pi, si);
                            return (
                              <div key={si}>
                                {/* Subsection header (only if different from phase) */}
                                {sub.title !== phase.title && (
                                  <div
                                    className="flex items-center gap-2 px-6 py-2 bg-gray-50/50 cursor-pointer"
                                    onClick={() => toggleSubsection(pi, si)}
                                  >
                                    <CheckIcon state={subState} />
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {sub.title}
                                    </span>
                                    <Badge variant="outline" className="text-xs ml-auto">
                                      {sub.tasks.length}
                                    </Badge>
                                  </div>
                                )}
                                {/* Tasks */}
                                <div className="divide-y">
                                  {sub.tasks.map((task, ti) => {
                                    const key = `${pi}-${si}-${ti}`;
                                    const isSelected = selectedTasks.has(key);
                                    return (
                                      <div
                                        key={key}
                                        className="flex items-center gap-2 px-6 py-1.5 hover:bg-gray-50/50 cursor-pointer"
                                        onClick={() => toggleTask(key)}
                                      >
                                        {isSelected ? (
                                          <CheckSquare className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                        ) : (
                                          <Square className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                        )}
                                        <span className="text-xs font-mono text-muted-foreground w-8 flex-shrink-0">
                                          {task.number}
                                        </span>
                                        <span className="text-sm flex-1 truncate">{task.title}</span>
                                        <Badge className={`text-[10px] ${STATUS_COLORS[task.status]}`}>
                                          {STATUS_LABELS[task.status]}
                                        </Badge>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {phases.length > 0 && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setOpen(false); resetState(); }}
              disabled={isImporting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || selectedTasks.size === 0 || !orderId}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Импорт...
                </>
              ) : (
                `Импортировать (${selectedTasks.size})`
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
