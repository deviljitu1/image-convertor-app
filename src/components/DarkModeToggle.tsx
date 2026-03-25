import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ||
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}
