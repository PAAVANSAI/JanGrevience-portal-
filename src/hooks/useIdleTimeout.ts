"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Timeout in ms (e.g. 30 mins)
// Warning in ms (e.g. 25 mins)

export function useIdleTimeout(timeoutMs = 30 * 60 * 1000, warningMs = 25 * 60 * 1000) {
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  const resetTimer = useCallback(() => {
    setIsWarningModalOpen(false);
    setRemainingSeconds(0);
    // Setting last active in localStorage or state could be done, 
    // but a simple event listener approach is fine for a single tab.
  }, []);

  useEffect(() => {
    let timeoutTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    let countdownInterval: NodeJS.Timeout;

    const handleIdle = async () => {
      // User has reached timeout
      clearInterval(countdownInterval);
      setIsWarningModalOpen(false);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
        router.push("/login?timeout=1");
        router.refresh();
      }
    };

    const handleWarning = () => {
      // User has reached warning threshold
      setIsWarningModalOpen(true);
      setRemainingSeconds(Math.floor((timeoutMs - warningMs) / 1000));
      
      countdownInterval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleIdle();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const startTimers = () => {
      clearTimeout(warningTimer);
      clearTimeout(timeoutTimer);
      clearInterval(countdownInterval);
      
      // We only want to start the timer if they are actually logged in
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          warningTimer = setTimeout(handleWarning, warningMs);
          timeoutTimer = setTimeout(handleIdle, timeoutMs);
        }
      });
    };

    // Events that reset the timer
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    
    const activityHandler = () => {
      if (!isWarningModalOpen) {
        startTimers();
      }
    };

    events.forEach(e => window.addEventListener(e, activityHandler));
    
    startTimers(); // Initial start

    return () => {
      events.forEach(e => window.removeEventListener(e, activityHandler));
      clearTimeout(warningTimer);
      clearTimeout(timeoutTimer);
      clearInterval(countdownInterval);
    };
  }, [timeoutMs, warningMs, isWarningModalOpen, router, supabase]);

  return { isWarningModalOpen, remainingSeconds, resetTimer };
}
