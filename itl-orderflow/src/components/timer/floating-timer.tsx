"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Square,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Save,
} from "lucide-react";
import { createTimeEntry } from "@/actions/time-entries";

interface TimerOrder {
  id: string;
  number: string;
  title: string;
}

interface FloatingTimerProps {
  orders: TimerOrder[];
  userId: string;
}

export function FloatingTimer({ orders, userId }: FloatingTimerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - startTimeRef.current) / 1000);
        setElapsed(accumulatedRef.current + diff);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      accumulatedRef.current = elapsed;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const handleStart = () => {
    if (!selectedOrderId) return;
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = async () => {
    setIsRunning(false);

    if (elapsed < 60) {
      // Less than 1 minute — don't save
      resetTimer();
      return;
    }

    if (!selectedOrderId) return;

    setIsSaving(true);
    try {
      const hours = Math.round((elapsed / 3600) * 4) / 4; // Round to nearest 0.25
      const formData = new FormData();
      formData.append("orderId", selectedOrderId);
      formData.append("userId", userId);
      formData.append("date", new Date().toISOString().slice(0, 10));
      formData.append("hours", String(Math.max(hours, 0.25)));
      formData.append("description", description);
      formData.append("isBillable", "true");

      await createTimeEntry(formData);
      resetTimer();
    } catch (error) {
      console.error("Error saving time entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetTimer = () => {
    setElapsed(0);
    accumulatedRef.current = 0;
    startTimeRef.current = 0;
    setDescription("");
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  // Minimized view when timer is running but panel is closed
  if (!isOpen && (isRunning || elapsed > 0)) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Clock className="w-4 h-4" />
          <span className="font-mono font-medium text-sm">
            {formatTime(elapsed)}
          </span>
          {isRunning && (
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          )}
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Hidden state
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full shadow-lg h-12 w-12"
          size="icon"
        >
          <Clock className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-background border rounded-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Таймер</span>
          {isRunning && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0">
              REC
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsOpen(false)}
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Timer display */}
      <div className="px-4 py-4 text-center">
        <div className="text-4xl font-mono font-bold tracking-wider">
          {formatTime(elapsed)}
        </div>
        {selectedOrder && (
          <p className="text-xs text-muted-foreground mt-2">
            {selectedOrder.number} — {selectedOrder.title}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-3 space-y-3">
        {/* Order select */}
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(e.target.value)}
          disabled={isRunning}
        >
          <option value="">Выберите заказ...</option>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.number} — {order.title}
            </option>
          ))}
        </select>

        {/* Description */}
        <input
          type="text"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Описание работы..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-3">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              disabled={!selectedOrderId}
              className="gap-1.5"
              size="sm"
            >
              <Play className="w-4 h-4" />
              {elapsed > 0 ? "Продолжить" : "Старт"}
            </Button>
          ) : (
            <Button onClick={handlePause} variant="outline" size="sm" className="gap-1.5">
              <Pause className="w-4 h-4" />
              Пауза
            </Button>
          )}

          {elapsed > 0 && (
            <>
              <Button
                onClick={handleStop}
                variant="default"
                size="sm"
                className="gap-1.5"
                disabled={isSaving}
              >
                <Save className="w-4 h-4" />
                Сохранить
              </Button>
              <Button
                onClick={resetTimer}
                variant="ghost"
                size="sm"
                disabled={isRunning || isSaving}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {elapsed > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            {Math.max(
              Math.round((elapsed / 3600) * 4) / 4,
              0.25
            )}
            ч будет записано
          </p>
        )}
      </div>
    </div>
  );
}
