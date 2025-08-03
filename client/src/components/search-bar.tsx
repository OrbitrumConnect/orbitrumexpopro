import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface SearchBarProps {
  isExpanded: boolean;
  onSearch: (query: string) => void;
  onClose?: () => void;
  onConfirm?: () => void;
}

export function SearchBar({ isExpanded, onSearch, onClose, onConfirm }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      onConfirm?.();
    }
  };

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          className="glassmorphism rounded-full px-2.5 py-1 w-44 z-50 scale-[0.83] md:scale-100 relative top-2 md:top-0"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative flex items-center">
            <Input
              type="text"
              placeholder="Ex: eletricista, pintor, encanador..."
              value={query}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="bg-transparent border-none outline-none text-white placeholder-gray-300 w-full pr-16 text-xs h-6 leading-6"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query.trim() && (
                <button
                  onClick={() => {
                    onConfirm?.();
                  }}
                  className="w-4 h-4 text-green-400 hover:text-green-300 transition-colors drop-shadow-[0_0_4px_rgba(34,197,94,0.5)] flex items-center justify-center"
                  title="Confirmar pesquisa"
                >
                  <Check className="w-3 h-3" />
                </button>
              )}
              {!query && (
                <Search className="w-4 h-4 text-[var(--neon-cyan)]" />
              )}
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    onSearch("");
                    onClose?.();
                  }}
                  className="w-4 h-4 text-red-400 hover:text-red-300 transition-colors drop-shadow-[0_0_4px_rgba(239,68,68,0.5)] flex items-center justify-center"
                  title="Fechar pesquisa"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
