"use client";

import { useEffect, useMemo, useRef } from "react";

interface BehaviourStats {
  answerEdits: number;
  backtracks: number;
  idlePauses: number;
  tabSwitches: number;
  scrollDepthPercent: number;
}

function roundSeconds(milliseconds: number) {
  return Math.max(1, Math.round(milliseconds / 1000));
}

export function useBehaviourTracker() {
  const startedAtRef = useRef<number>(Date.now());
  const activeFieldRef = useRef<string | null>(null);
  const activeFieldStartedAtRef = useRef<number | null>(null);
  const fieldDurationsRef = useRef<Record<string, number>>({});
  const lastInteractionAtRef = useRef<number>(Date.now());
  const idleWindowOpenRef = useRef(false);
  const statsRef = useRef<BehaviourStats>({
    answerEdits: 0,
    backtracks: 0,
    idlePauses: 0,
    tabSwitches: 0,
    scrollDepthPercent: 0
  });

  const finalizeActiveField = () => {
    if (!activeFieldRef.current || activeFieldStartedAtRef.current === null) {
      return;
    }

    const elapsed = Date.now() - activeFieldStartedAtRef.current;
    fieldDurationsRef.current[activeFieldRef.current] =
      (fieldDurationsRef.current[activeFieldRef.current] ?? 0) + elapsed;
    activeFieldStartedAtRef.current = Date.now();
  };

  const noteInteraction = () => {
    lastInteractionAtRef.current = Date.now();
    idleWindowOpenRef.current = false;
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        statsRef.current.tabSwitches += 1;
      }
    };

    const handleActivity = () => {
      noteInteraction();
    };

    const handleScroll = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = documentHeight > 0 ? (window.scrollY / documentHeight) * 100 : 100;
      statsRef.current.scrollDepthPercent = Math.max(statsRef.current.scrollDepthPercent, Math.round(depth));
      noteInteraction();
    };

    const idleInterval = window.setInterval(() => {
      if (!idleWindowOpenRef.current && Date.now() - lastInteractionAtRef.current > 12000) {
        statsRef.current.idlePauses += 1;
        idleWindowOpenRef.current = true;
      }
    }, 3000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("touchstart", handleActivity, { passive: true });

    return () => {
      window.clearInterval(idleInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, []);

  return useMemo(
    () => ({
      beginField(fieldName: string) {
        noteInteraction();

        if (activeFieldRef.current === fieldName) {
          return;
        }

        finalizeActiveField();
        activeFieldRef.current = fieldName;
        activeFieldStartedAtRef.current = Date.now();
      },
      endField(fieldName?: string) {
        noteInteraction();

        if (fieldName && activeFieldRef.current !== fieldName) {
          return;
        }

        finalizeActiveField();
        activeFieldRef.current = null;
        activeFieldStartedAtRef.current = null;
      },
      recordAnswerEdit() {
        noteInteraction();
        statsRef.current.answerEdits += 1;
      },
      recordBacktrack() {
        noteInteraction();
        statsRef.current.backtracks += 1;
      },
      buildMetrics(completionRatePercent: number) {
        finalizeActiveField();

        return {
          totalCompletionSeconds: roundSeconds(Date.now() - startedAtRef.current),
          timePerStepSeconds: Object.fromEntries(
            Object.entries(fieldDurationsRef.current).map(([key, milliseconds]) => [key, roundSeconds(milliseconds)])
          ),
          backtracks: statsRef.current.backtracks,
          answerEdits: statsRef.current.answerEdits,
          idlePauses: statsRef.current.idlePauses,
          tabSwitches: statsRef.current.tabSwitches,
          scrollDepthPercent: Math.max(statsRef.current.scrollDepthPercent, 10),
          completionRatePercent
        };
      }
    }),
    []
  );
}
