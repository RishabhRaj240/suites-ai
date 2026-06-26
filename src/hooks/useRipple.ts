import { useCallback } from "react";

/**
 * useRipple — attaches a Material-style ripple effect to any button.
 *
 * Usage:
 *   const ripple = useRipple();
 *   <button className="ripple-btn" onClick={ripple(myClickHandler)}>...</button>
 *
 * Or just:
 *   <button className="ripple-btn" onClick={(e) => { ripple()(e); doSomething(); }}>
 */
export function useRipple() {
  const createRipple = useCallback(
    (handler?: (e: React.MouseEvent<HTMLButtonElement>) => void) =>
      (e: React.MouseEvent<HTMLButtonElement>) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const circle = document.createElement("span");
        const diameter = Math.max(btn.clientWidth, btn.clientHeight);
        const radius = diameter / 2;
        const rect = btn.getBoundingClientRect();

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - rect.left - radius}px`;
        circle.style.top = `${e.clientY - rect.top - radius}px`;
        circle.classList.add("ripple");

        // Remove any existing ripple
        const existing = btn.querySelector(".ripple");
        if (existing) existing.remove();

        btn.appendChild(circle);

        // Clean up after animation
        setTimeout(() => circle.remove(), 600);

        handler?.(e);
      },
    []
  );

  return createRipple;
}
