import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

// Renders a number that smoothly counts up/down to value
export const AnimatedNumber = ({
  value,
  duration = 0.5,
  ...props
}: AnimatedNumberProps) => {
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [value, duration, mv]);

  return <motion.span {...props}>{rounded}</motion.span>;
};
