"use client";

import { useEffect, useRef } from "react";

export function CursorRipple() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;
        cursor.style.setProperty("--cursor-x", `${event.clientX}px`);
        cursor.style.setProperty("--cursor-y", `${event.clientY}px`);
        cursor.dataset.visible = "true";
      });
    };
    const leave = () => {
      if (cursorRef.current) cursorRef.current.dataset.visible = "false";
    };
    const pulse = () => {
      const cursor = cursorRef.current;
      if (!cursor) return;
      cursor.classList.remove("is-pressed");
      void cursor.offsetWidth;
      cursor.classList.add("is-pressed");
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", pulse);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", pulse);
    };
  }, []);

  return <div ref={cursorRef} className="cursor-ripple" data-visible="false" aria-hidden="true" />;
}
