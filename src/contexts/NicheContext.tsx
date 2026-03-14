import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface NicheContextType {
  niche: string;
  setNiche: (niche: string) => void;
  customNiches: string[];
  addCustomNiche: (niche: string) => void;
}

const DEFAULT_NICHE = "Empreendedorismo";

const NicheContext = createContext<NicheContextType>({
  niche: DEFAULT_NICHE,
  setNiche: () => {},
  customNiches: [],
  addCustomNiche: () => {},
});

export const useNiche = () => useContext(NicheContext);

export function NicheProvider({ children }: { children: ReactNode }) {
  const [niche, setNicheState] = useState<string>(DEFAULT_NICHE);
  const [customNiches, setCustomNiches] = useState<string[]>([]);

  // Load initial state
  useEffect(() => {
    const savedNiche = localStorage.getItem("creatoros_active_niche");
    if (savedNiche) {
      setNicheState(savedNiche);
    }

    const savedCustoms = localStorage.getItem("creatoros_custom_niches_v2");
    if (savedCustoms) {
      try {
        setCustomNiches(JSON.parse(savedCustoms));
      } catch (e) {
        console.error("Error parsing custom niches", e);
      }
    }
  }, []);

  const setNiche = (newNiche: string) => {
    setNicheState(newNiche);
    localStorage.setItem("creatoros_active_niche", newNiche);
  };

  const addCustomNiche = (newNiche: string) => {
    const trimmed = newNiche.trim();
    if (!trimmed) return;
    
    // Prevent duplicates
    if (!customNiches.includes(trimmed)) {
      const updated = [...customNiches, trimmed];
      setCustomNiches(updated);
      localStorage.setItem("creatoros_custom_niches_v2", JSON.stringify(updated));
    }
    
    // Auto-select the newly added niche
    setNiche(trimmed);
  };

  return (
    <NicheContext.Provider value={{ niche, setNiche, customNiches, addCustomNiche }}>
      {children}
    </NicheContext.Provider>
  );
}
