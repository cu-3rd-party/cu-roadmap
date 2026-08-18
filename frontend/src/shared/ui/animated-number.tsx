import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, type ComponentProps } from "react";

interface AnimatedNumberProps extends ComponentProps<typeof motion.span> {
  value: number;
  duration?: number;
  decimals?: number;
}

// Renders a number that smoothly counts up/down to value
export const AnimatedNumber = ({
  value,
  duration = 0.5,
  decimals = 0,
  ...props
}: AnimatedNumberProps) => {
  const mv = useMotionValue(value);
  const formatted = useTransform(mv, (v) => v.toFixed(decimals));

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [value, duration, mv]);

  return <motion.span {...props}>{formatted}</motion.span>;
};
