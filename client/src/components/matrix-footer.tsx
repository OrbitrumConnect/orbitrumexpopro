import { useEffect, useState } from "react";
import { Link } from "wouter";

interface MatrixChar {
  id: number;
  char: string;
  left: string;
  duration: number;
  delay: number;
}

interface AlienGlyph {
  id: number;
  glyph: string;
  left: string;
  bottom: string;
  rotation: number;
}

export function MatrixFooter() {
  const [matrixChars, setMatrixChars] = useState<MatrixChar[]>([]);
  const [alienGlyphs, setAlienGlyphs] = useState<AlienGlyph[]>([]);

  useEffect(() => {
    // Generate matrix characters
    const chars: MatrixChar[] = Array.from({ length: 11 }, (_, i) => ({
      id: i,
      char: Math.random() > 0.5 ? "0" : "1",
      left: `${i * 9 + 5}%`,
      duration: 25 + Math.random() * 15,
      delay: Math.random() * 8,
    }));

    // Generate alien glyphs
    const glyphs = ["⧫", "◊", "▣", "☊", "◈", "⟐", "⬢", "⟑", "◉"];
    const alienSymbols: AlienGlyph[] = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
      left: `${10 + i * 20}%`,
      bottom: `${10 + Math.random() * 15}px`,
      rotation: -12 + Math.random() * 24,
    }));

    setMatrixChars(chars);
    setAlienGlyphs(alienSymbols);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-20 sm:h-24 md:h-32 overflow-hidden pointer-events-none">
      {/* Matrix Rain Animation */}
      <div className="absolute inset-0 opacity-15">
        {matrixChars.map((char) => (
          <div
            key={char.id}
            className="matrix-char absolute text-lg animate-matrix-rain"
            style={{
              left: char.left,
              animationDuration: `${char.duration}s`,
              animationDelay: `${char.delay}s`,
            }}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="block">
                {Math.random() > 0.5 ? "1" : "0"}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Alien Hieroglyphs */}
      <div className="absolute inset-0 opacity-10">
        {alienGlyphs.map((glyph) => (
          <div
            key={glyph.id}
            className="absolute text-2xl neon-text"
            style={{
              left: glyph.left,
              bottom: glyph.bottom,
              transform: `rotate(${glyph.rotation}deg)`,
              textShadow: '0 0 5px var(--neon-cyan)',
            }}
          >
            {glyph.glyph}
          </div>
        ))}
      </div>
      
      {/* Legal Links - Organized in two clean lines */}
      <div className="absolute bottom-2 left-[50%] transform -translate-x-1/2 pointer-events-auto z-[100]">
        <div className="flex flex-col items-center space-y-2 text-xs text-gray-300">
          {/* Primeira linha - Links principais */}
          <div className="flex space-x-8 bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm">
            <Link href="/termos" className="hover:text-[var(--neon-cyan)] transition-colors duration-300 hover:scale-105 font-medium">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:text-[var(--neon-cyan)] transition-colors duration-300 hover:scale-105 font-medium">
              Privacidade
            </Link>
          </div>
          {/* Segunda linha - Regras, certificações e status */}
          <div className="flex items-center space-x-6 bg-black/40 px-4 py-1 rounded-full backdrop-blur-sm">
            <Link href="/regras" className="hover:text-[var(--neon-cyan)] transition-colors duration-300 hover:scale-105 font-medium">
              Regras
            </Link>
            <Link href="/certificacoes" className="hover:text-yellow-400 transition-colors duration-300 hover:scale-105 font-medium">
              Certificações
            </Link>

          </div>
        </div>
      </div>


    </footer>
  );
}
