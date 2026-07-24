"use client";
import { useEffect, useState } from "react";
import { Icon } from "./icons";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("koniq-fit-theme", next ? "dark" : "light"); } catch {}
  }
  return (
    <button onClick={toggle} className="btn btn-ghost btn-sm" title="Thema wisselen" aria-label="Thema wisselen">
      <Icon name={dark ? "sun" : "moon"} size={17} />
    </button>
  );
}
