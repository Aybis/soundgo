import { useEffect, useRef, useState } from "react";
import { GesturePointer } from "../motion/pointer/GesturePointer";
import type { useVision } from "./useVision";

type Vision = ReturnType<typeof useVision>;

export interface ControllerPointer {
  x: number;
  y: number;
  pinching: boolean;
  present: boolean;
  source: "hand" | "mouse" | "none";
}

interface MouseState { x: number; y: number; in: boolean; down: boolean; }

/**
 * Combines the camera gesture pointer with a mouse fallback (also the
 * accessibility path). Games get one pointer + a selectTick that increments
 * on every selection (pinch from hand, or click).
 */
export function usePointerController(
  vision: Vision,
  stageRef: React.RefObject<HTMLDivElement | null>,
  enabled = true,
) {
  const [pointer, setPointer] = useState<ControllerPointer>({ x: -100, y: -100, pinching: false, present: false, source: "none" });
  const pointerRef = useRef(pointer);
  const [selectTick, setSelectTick] = useState(0);
  const selectTickRef = useRef(0);
  const gp = useRef(new GesturePointer());
  const mouse = useRef<MouseState | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    let lastX = -100, lastY = -100;

    const loop = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const frame = vision.latestFrame?.current ?? null;
      const gpState = gp.current.update(frame, vision.camera, w, h, performance.now());
      let next: ControllerPointer;

      if (gpState.present) {
        next = { x: gpState.x, y: gpState.y, pinching: gpState.pinching, present: true, source: "hand" };
        if (gpState.pinching && !pointerRef.current.pinching) {
          selectTickRef.current++;
          setSelectTick(selectTickRef.current);
        }
      } else if (mouse.current?.in) {
        next = { x: mouse.current.x, y: mouse.current.y, pinching: mouse.current.down, present: true, source: "mouse" };
      } else {
        next = { ...pointerRef.current, present: false, source: "none" };
      }

      const moved =
        Math.hypot(next.x - lastX, next.y - lastY) > 2 ||
        next.pinching !== pointerRef.current.pinching ||
        next.source !== pointerRef.current.source;
      pointerRef.current = next;
      if (moved) {
        lastX = next.x; lastY = next.y;
        setPointer(next);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e: MouseEvent) => {
      const r = stageRef.current?.getBoundingClientRect();
      if (r) mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top, in: true, down: mouse.current?.down ?? false };
    };
    const onDown = (e: MouseEvent) => {
      if (mouse.current) mouse.current.down = true;
      onMove(e);
      selectTickRef.current++;
      setSelectTick(selectTickRef.current);
    };
    const onUp = () => { if (mouse.current) mouse.current.down = false; };
    const stage = stageRef.current;
    stage?.addEventListener("mousemove", onMove);
    stage?.addEventListener("mousedown", onDown);
    stage?.addEventListener("mouseup", onUp);
    stage?.addEventListener("mouseleave", () => { if (mouse.current) mouse.current.in = false; });

    return () => {
      cancelAnimationFrame(raf);
      stage?.removeEventListener("mousemove", onMove);
      stage?.removeEventListener("mousedown", onDown);
      stage?.removeEventListener("mouseup", onUp);
    };
  }, [enabled, vision, stageRef]);

  return { pointer, selectTick };
}