import { useEffect, useRef } from "react";

export function useOrbitAnimation(
  radius: number,
  speed: number,
  direction: "clockwise" | "counter-clockwise" = "clockwise"
) {
  const elementRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const angleRef = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const animate = () => {
      const multiplier = direction === "clockwise" ? 1 : -1;
      angleRef.current += speed * multiplier;
      
      const radians = (angleRef.current * Math.PI) / 180;
      const x = Math.cos(radians) * radius;
      const y = Math.sin(radians) * radius;
      
      element.style.transform = `translate(${x}px, ${y}px)`;
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [radius, speed, direction]);

  return elementRef;
}
