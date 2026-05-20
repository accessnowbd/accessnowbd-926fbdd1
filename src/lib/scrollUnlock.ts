export function installScrollUnlock(): () => void {
  if (typeof window === "undefined") return () => {};

  const readScrollY = () => window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const maxScrollY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  const hasScrollableParent = (target: EventTarget | null, deltaY: number) => {
    let node = target instanceof Element ? target : null;
    while (node && node !== document.body && node !== document.documentElement) {
      const style = window.getComputedStyle(node);
      const canScroll = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1;
      if (canScroll) {
        const atTop = node.scrollTop <= 0;
        const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
        return deltaY < 0 ? !atTop : !atBottom;
      }
      node = node.parentElement;
    }
    return false;
  };

  const onWheel = (event: WheelEvent) => {
    if (event.defaultPrevented || event.deltaY === 0 || hasScrollableParent(event.target, event.deltaY)) return;
    const before = readScrollY();
    requestAnimationFrame(() => {
      const after = readScrollY();
      if (Math.abs(after - before) > 1) return;
      if ((event.deltaY < 0 && after <= 0) || (event.deltaY > 0 && after >= maxScrollY() - 1)) return;
      window.scrollBy({ top: event.deltaY, behavior: "auto" });
    });
  };

  window.addEventListener("wheel", onWheel, { capture: true, passive: true });
  return () => window.removeEventListener("wheel", onWheel, { capture: true });
}