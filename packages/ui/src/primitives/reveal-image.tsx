import { useCallback, useState, type CSSProperties } from "react";

import { cn } from "../lib/cn";

// Tracks which image URLs have already loaded this session so a given image only ever plays its reveal once
const loadedSrcs = new Set<string>();

export const RevealImage = ({
  src,
  className,
  style,
  onLoad,
  duration = 600,
  ...props
}: React.ComponentProps<"img"> & { duration?: number }) => {
  const key = typeof src === "string" ? src : "";

  // Already revealed earlier this session
  const [loaded, setLoaded] = useState(() => loadedSrcs.has(key));
  const [animate, setAnimate] = useState(false);

  const markLoaded = useCallback(
    (shouldAnimate: boolean) => {
      if (key) loadedSrcs.add(key);
      if (shouldAnimate) setAnimate(true);
      setLoaded(true);
    },
    [key],
  );

  // A cached image can already be complete before React attaches onLoad
  const setRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth > 0) markLoaded(false);
    },
    [markLoaded],
  );

  const revealStyle: CSSProperties = {
    clipPath: loaded ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
    opacity: loaded ? 1 : 0,
    transition: animate
      ? `clip-path ${duration}ms ease-out, opacity ${Math.round(duration * 0.6)}ms ease-out`
      : undefined,
    willChange: animate ? "clip-path" : undefined,
    ...style,
  };

  return (
    <img
      ref={setRef}
      src={src}
      className={cn(className)}
      style={revealStyle}
      onLoad={(event) => {
        markLoaded(true);
        onLoad?.(event);
      }}
      {...props}
    />
  );
};
