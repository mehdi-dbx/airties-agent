import { cn } from '@/lib/utils';
import { motion, useAnimation } from 'framer-motion';
import { SparklesIcon } from 'lucide-react';
import { useEffect } from 'react';

type AnimatedAssistantIconProps = {
  /** Diameter of the inner SparklesIcon */
  size?: number;
  /** Run the pulse / rotate animation while true */
  isLoading?: boolean;
  // If true, the component will appear muted and animate at more slow and subtle
  muted?: boolean;
};

export const AnimatedAssistantIcon = ({
  size = 20,
  isLoading = false,
  muted = false,
}: AnimatedAssistantIconProps) => {
  const scaleControls = useAnimation();
  const rotateControls = useAnimation();

  useEffect(() => {
    if (isLoading) {
      if (!muted) {
        scaleControls.start({
          scale: [0.9, 1.1],
          transition: {
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
            duration: 1,
            ease: 'easeInOut',
          },
        });
      }

      rotateControls.start({
        rotate: [0, 1800],
        transition: {
          repeat: Number.POSITIVE_INFINITY,
          duration: 2,
          ease: 'easeInOut',
        },
      });
    } else {
      scaleControls.stop();
      rotateControls.stop();

      scaleControls.start({
        scale: 1,
        transition: { duration: 0.5, ease: 'easeOut' },
      });
      rotateControls.start({
        rotate: 0,
        transition: { duration: 0.5, ease: 'easeOut' },
      });
    }
  }, [isLoading, muted, scaleControls, rotateControls]);

  return (
    <div
      className={cn(
        '-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full',
        {
          'opacity-50': muted,
        },
      )}
      style={{ position: 'relative' }}
    >
      {/* Outer ring — navy gradient */}
      <motion.div
        animate={scaleControls}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
        }}
      >
        <motion.div
          animate={rotateControls}
          style={{
            background: 'linear-gradient(135deg, #000098, #4040AF, #7070C4)',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
          }}
        />
      </motion.div>

      {/* Middle solid background */}
      <motion.div
        animate={scaleControls}
        style={{
          background: 'var(--background)',
          position: 'absolute',
          inset: '2px',
          borderRadius: '100%',
        }}
      />

      {/* Top icon */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,152,0.08), rgba(64,64,175,0.08), rgba(112,112,196,0.08))',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          zIndex: 1,
        }}
      >
        <SparklesIcon size={size} className="text-[var(--primary)]" />
      </div>
    </div>
  );
};

/**
 * Since we cannot use gradient colors for borders, we instead use composite background colors to achieve the same effect.
 */
export const getAiGradientStyle = () => {
  const createGradient = (...colors: string[]) =>
    `linear-gradient(135deg, ${colors.join(', ')})`;

  const gradientColors = ['#000098', '#4040AF', '#7070C4'];

  const topGradient = createGradient(
    ...gradientColors.map((color) => hexToRGBA(color, 0.08) ?? ''),
  );
  const solidGradient = createGradient(
    'var(--background)',
    'var(--background)',
  );
  const bottomGradient = createGradient(...gradientColors);

  return {
    topGradient,
    solidGradient,
    bottomGradient,
    styling: {
      border: '1px solid transparent',
      background: [
        `${topGradient} padding-box`,
        `${solidGradient} padding-box`,
        `${bottomGradient} border-box`,
      ].join(', '),
    },
  };
};

const hexToRGB = (hex: string): { r: number; g: number; b: number } | null => {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    return {
      r: Number.parseInt(result[1], 16),
      g: Number.parseInt(result[2], 16),
      b: Number.parseInt(result[3], 16),
    };
  } catch {
    return null;
  }
};

const hexToRGBA = (hex: string, alpha: number): string | null => {
  const rgb = hexToRGB(hex);
  if (rgb) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  return null;
};
