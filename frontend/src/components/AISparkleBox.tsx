import {
  Sparkles,
  Cpu,
  Brain,
  Zap,
  Atom,
  Orbit,
  Wind,
  Binary,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback, memo } from "react";

const AIPersona = {
  CONFIDENT: "ЫЫ",
  CONFUSED: "А?",
  SLURRED: "ЫЫЫ БЛЯ",
  CORPORATE: "AI™",
  RUSSIAN: "ИИ",
  MYSTICAL: "✨ИСКУССТВЕННЫЙ✨",
  DRUNK: "Э-ЭЙ ИИИ",
  AGGRESSIVE: "СЛЫШЬ, ИИ",
  WHISPER: "шшш... иии",
  EXISTENTIAL: "кто я? ии?",
} as const;

type AIPersonaType = (typeof AIPersona)[keyof typeof AIPersona];

const useCyclicText = (texts: AIPersonaType[], intervalMs: number = 150) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cycle = useCallback(() => {
    if (!isPaused) {
      setIndex((prev) => {
        let next = prev + direction;
        if (next >= texts.length) {
          setDirection(-1);
          next = texts.length - 2;
        } else if (next < 0) {
          setDirection(1);
          next = 1;
        }
        return next;
      });
    }
  }, [direction, isPaused, texts.length]);

  useEffect(() => {
    intervalRef.current = setInterval(cycle, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cycle, intervalMs]);

  const currentText = texts[index];
  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  return { currentText, pause, resume };
};

const SPARKLE_ICONS = [
  Sparkles,
  Cpu,
  Brain,
  Zap,
  Atom,
  Orbit,
  Wind,
  Binary,
] as const;
const SPARKLE_TYPES = SPARKLE_ICONS.length;

const RotatingSparkle = memo(({ size = 20 }: { size?: number }) => {
  const [rotation, setRotation] = useState(0);
  const [sparkleIndex, setSparkleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((r) => (r + 15) % 360);
      setSparkleIndex((i) => (i + 1) % SPARKLE_TYPES);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const Icon = SPARKLE_ICONS[sparkleIndex];
  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Icon size={size} className="text-primary opacity-80 hover:opacity-100" />
    </div>
  );
});

const MovingNoiseBackground = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((o) => (o + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute inset-0 rounded-xl opacity-5 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle at ${offset}% ${offset}%, #3b82f6 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      }}
    />
  );
};

const SUBTITLE_TEXTS = [
  "Система учтёт всё... даже то, о чём вы не просили",
  "100500 пререквизитов проанализировано (и 2 выдумано)",
  "Равномерно распределит нагрузку на ваш кофеин",
  "AI accuracy: ±500%",
] as const;

const BADGE_OPTIONS = ["v2.0 🤖", "beta ∞"] as const;

const useRotatingSubtitle = () => {
  const [subtitleIndex, setSubtitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((i) => (i + 1) % SUBTITLE_TEXTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return SUBTITLE_TEXTS[subtitleIndex];
};

const useRandomBadge = () => {
  const [badgeIndex, setBadgeIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBadgeIndex((i) => (i + 1) % BADGE_OPTIONS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return BADGE_OPTIONS[badgeIndex];
};

const useRandomConfidence = () => {
  const [confidence, setConfidence] = useState(() =>
    Math.floor(Math.random() * 40 + 60),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setConfidence(Math.floor(Math.random() * 40 + 60));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return confidence;
};

export const AISparkleBoxMadness = memo(() => {
  const [isHovering, setIsHovering] = useState(false);
  const [loadPercentage, setLoadPercentage] = useState(0);
  const [userConfused, setUserConfused] = useState(0);
  const [sparkleIntensity, setSparkleIntensity] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const analyzingRef = useRef(false);
  const loadPercentageRef = useRef(0);

  const subtitleText = useRotatingSubtitle();
  const randomBadge = useRandomBadge();
  const randomConfidence = useRandomConfidence();

  const isAnalyzing = loadPercentage > 0 && loadPercentage < 100;

  const {
    currentText: aiName,
    pause,
    resume,
  } = useCyclicText(Object.values(AIPersona) as AIPersonaType[], 120);

  useEffect(() => {
    const cleanup = () => {
      analyzingRef.current = false;
      loadPercentageRef.current = 0;
      setLoadPercentage(0);
    };

    if (isHovering) {
      analyzingRef.current = true;
      loadPercentageRef.current = 0;
      const startTime = performance.now();
      const interval = setInterval(() => {
        if (analyzingRef.current) {
          const elapsed = performance.now() - startTime;
          const newPercentage = Math.min(100, (elapsed / 1000) * 50);
          loadPercentageRef.current = newPercentage;
          setLoadPercentage(newPercentage);
        }
      }, 20);
      return () => {
        clearInterval(interval);
        requestAnimationFrame(cleanup);
      };
    } else {
      cleanup();
    }
  }, [isHovering]);

  useEffect(() => {
    const intensityInterval = setInterval(() => {
      if (isHovering) {
        setSparkleIntensity(0.8 + Math.random() * 0.7);
      } else {
        setSparkleIntensity(0.3 + Math.random() * 0.4);
      }
    }, 200);
    return () => clearInterval(intensityInterval);
  }, [isHovering]);

  const incrementConfusion = useCallback(() => {
    setUserConfused((c) => c + 1);
    setTimeout(() => {
      setUserConfused((c) => Math.max(0, c - 1));
    }, 1000);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl p-5 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] cursor-pointer overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={incrementConfusion}
      style={{
        background:
          "linear-gradient(135deg, var(--color-bg-hover) 0%, var(--color-bg-main) 100%)",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "var(--color-border)",
        boxShadow: isHovering
          ? `0 20px 35px -12px rgba(59,130,246,${0.3 + sparkleIntensity * 0.2})`
          : "0 4px 6px -1px rgba(0,0,0,0.1)",
        color: "var(--color-text-main)",
      }}
    >
      <MovingNoiseBackground />

      {isAnalyzing && (
        <div
          className="absolute top-0 left-0 right-0 h-1 overflow-hidden"
          style={{ backgroundColor: "var(--color-border)" }}
        >
          <div
            className="h-full transition-all duration-50"
            style={{
              width: `${loadPercentage}%`,
              backgroundColor: "var(--color-primary)",
            }}
          />
        </div>
      )}

      <div className="flex items-start gap-3 relative z-10">
        <div
          className="mt-0.5 shrink-0 transition-all duration-150"
          style={{
            opacity: sparkleIntensity,
            filter: `blur(${isHovering ? 0 : 0.5}px)`,
          }}
        >
          <RotatingSparkle size={22} />
        </div>

        <div className="flex-1">
          <div
            className="font-black text-lg tracking-tight transition-all duration-100"
            onMouseEnter={() => {
              if (!isHovering) pause();
            }}
            onMouseLeave={() => {
              if (!isHovering) resume();
            }}
          >
            <span
              className="font-black text-lg tracking-tight transition-all duration-100"
              style={{ color: "var(--color-text-main)" }}
            >
              {isAnalyzing ? (
                <span className="inline-flex items-center gap-1">
                  {aiName}
                  <span className="animate-pulse text-xs">...</span>
                </span>
              ) : isHovering ? (
                <span className="text-2xl animate-bounce inline-block">
                  {aiName}
                </span>
              ) : (
                "ЫЫ"
              )}
            </span>
            <span
              className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--color-bg-main)",
                color: "var(--color-text-muted)",
              }}
            >
              {isAnalyzing
                ? `analysis ${loadPercentage}%`
                : `confidence ${randomConfidence}%`}
            </span>
          </div>

          <div
            className="text-sm font-bold mt-1 flex items-center gap-2 flex-wrap"
            style={{ color: "var(--color-text-main)" }}
          >
            {isAnalyzing
              ? "генерирует оптимальный план..."
              : "сгенерирует оптимальный план"}
            {userConfused > 0 && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: "rgba(239,68,68,0.2)",
                  color: "#ef4444",
                }}
              >
                🤔 confused x{userConfused}
              </span>
            )}
          </div>

          <div
            className="text-xs mt-1.5 font-mono border-l-2 pl-2 italic"
            style={{
              borderColor: "var(--color-primary)",
              color: "var(--color-text-muted)",
            }}
          >
            {subtitleText}
          </div>

          <div
            className={`overflow-hidden transition-all duration-500 ${
              isHovering ? "max-h-20 mt-3 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div
              className="text-[9px] border-t pt-2 font-mono"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              ⚠️ AI may hallucinate prerequisites, invent workload distribution,
              and occasionally identify as a potato. Results not guaranteed.
              <br />
              🔥 Powered by Blockchain, Quantum Vibes, and Overengineering™
            </div>
          </div>
        </div>

        <div className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
          <div
            className="text-[8px] font-mono rounded px-1.5 py-1 rotate-6"
            style={{
              backgroundColor: "var(--color-bg-main)",
              color: "var(--color-text-muted)",
            }}
          >
            {randomBadge}
          </div>
        </div>
      </div>

      {userConfused > 0 && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse rounded-xl"
          style={{ backgroundColor: "rgba(239,68,68,0.05)" }}
        />
      )}
    </div>
  );
});
React.memo(AISparkleBoxMadness);

export const AISparkleBoxSimple = memo(() => {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ backgroundColor: "var(--color-bg-hover)" }}
    >
      <Sparkles
        size={20}
        className="mt-0.5 shrink-0"
        style={{ color: "var(--color-primary)" }}
      />
      <div>
        <div
          className="font-bold text-sm"
          style={{ color: "var(--color-text-main)" }}
        >
          AI сгенерирует оптимальный план
        </div>
        <div
          className="text-xs mt-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          Система учтёт все пререквизиты и равномерно распределит нагрузку
        </div>
      </div>
    </div>
  );
});
React.memo(AISparkleBoxSimple);

export const AISparkleBox = memo(() => {
  const showMadness = Math.random() < 0.05;

  if (showMadness) {
    return <AISparkleBoxMadness />;
  } else {
    return <AISparkleBoxSimple />;
  }
});
React.memo(AISparkleBox);
