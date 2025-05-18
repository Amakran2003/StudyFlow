import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "../../lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, ...props }, ref) => {
  // Ensure value is a number and within bounds
  const normalizedValue = Math.max(0, Math.min(100, value));
  
  // Use refs to track the last value for smooth animation
  const lastValueRef = React.useRef<number>(normalizedValue);
  const [currentValue, setCurrentValue] = React.useState<number>(normalizedValue);

  React.useEffect(() => {
    const targetValue = Math.max(0, Math.min(100, value));
    
    // If the value change is small, update immediately
    if (Math.abs(targetValue - lastValueRef.current) <= 2) {
      setCurrentValue(targetValue);
      lastValueRef.current = targetValue;
      return;
    }

    // For larger changes, animate smoothly
    const startValue = lastValueRef.current;
    const endValue = targetValue;
    const duration = 300; // ms
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use an ease-out cubic function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const interpolatedValue = startValue + (endValue - startValue) * easeProgress;

      setCurrentValue(interpolatedValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        lastValueRef.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary"
        style={{ 
          transform: `translateX(-${100 - currentValue}%)`,
          transition: Math.abs(normalizedValue - lastValueRef.current) <= 2 ? 'transform 150ms linear' : 'none'
        }}
      />
    </ProgressPrimitive.Root>
  );
})

Progress.displayName = "Progress"

export { Progress }
