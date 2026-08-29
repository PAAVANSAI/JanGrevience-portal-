"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

export default function AnimatedCounter({ value, duration = 1 }: AnimatedCounterProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      const controls = animate(count, value, { duration });
      return controls.stop;
    }
  }, [value, duration, hasMounted, count]);

  // Avoid hydration mismatch by rendering static value before JS loads
  if (!hasMounted) {
    return <span>{value}</span>;
  }

  return <motion.span>{rounded}</motion.span>;
}
