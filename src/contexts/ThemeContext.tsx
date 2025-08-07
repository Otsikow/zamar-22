import React, {createContext, useContext, useEffect, useMemo, useState} from "react"

type Theme = "light" | "dark" | "system"
type Ctx = { theme: Theme; setTheme: (t: Theme) => void }
const ThemeContext = createContext<Ctx | undefined>(undefined)

function getSystem(): "light" | "dark" {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark" : "light"
}

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || "system"
  )

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem("theme", t)
    applyTheme(t)
  }

  const applyTheme = (t: Theme) => {
    const root = document.documentElement
    const effective = t === "system" ? getSystem() : t
    if (effective === "dark") root.classList.add("dark")
    else root.classList.remove("dark")
  }

  // initial + respond to system changes when in "system"
  useEffect(() => {
    applyTheme(theme)
    if (theme !== "system") return
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => applyTheme("system")
    mql.addEventListener?.("change", handler)
    return () => mql.removeEventListener?.("change", handler)
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}