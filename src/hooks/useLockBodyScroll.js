import { useLayoutEffect } from "react";

let lockCount = 0;
let originalOverflow = "";

export default function useLockBodyScroll(locked = true) {
  useLayoutEffect(() => {
    if (!locked) return;

    if (lockCount === 0) {
      originalOverflow = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [locked]);
}
