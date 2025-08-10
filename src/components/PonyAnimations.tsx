import React from 'react';
import { motion } from 'framer-motion';

const PonySVG = () => (
  <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="100" cy="120" rx="45" ry="35" fill="#ff6ec7"/>
    
    {/* Neck */}
    <ellipse cx="75" cy="95" rx="20" ry="25" fill="#ff6ec7" transform="rotate(-30 75 95)"/>
    
    {/* Head */}
    <ellipse cx="60" cy="70" rx="25" ry="22" fill="#ff6ec7"/>
    
    {/* Snout */}
    <ellipse cx="45" cy="75" rx="12" ry="10" fill="#ff8ed0"/>
    
    {/* Horn (unicorn) */}
    <path d="M60 55 L58 40 L62 40 Z" fill="#ffd700" stroke="#ffb300" strokeWidth="1"/>
    <path d="M58 45 L62 45" stroke="#ffb300" strokeWidth="1"/>
    <path d="M58.5 50 L61.5 50" stroke="#ffb300" strokeWidth="1"/>
    
    {/* Ear */}
    <path d="M70 55 L75 45 L72 52 Z" fill="#ff6ec7"/>
    
    {/* Mane (flowing) */}
    <path d="M75 60 Q85 45, 80 35 Q85 40, 88 50 Q90 45, 87 35 Q92 40, 95 55" 
          stroke="#d946ef" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M70 65 Q80 50, 75 40 Q80 45, 83 55 Q85 50, 82 40" 
          stroke="#ff88ff" strokeWidth="6" fill="none" strokeLinecap="round"/>
    
    {/* Eye */}
    <ellipse cx="55" cy="70" rx="8" ry="10" fill="white"/>
    <ellipse cx="56" cy="72" rx="5" ry="7" fill="#8b2c8b"/>
    <ellipse cx="58" cy="70" rx="2" ry="3" fill="white"/>
    
    {/* Eyelashes */}
    <path d="M50 65 L48 63" stroke="#8b2c8b" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M52 63 L50 60" stroke="#8b2c8b" strokeWidth="1.5" strokeLinecap="round"/>
    
    {/* Legs */}
    <rect x="80" y="140" width="12" height="35" rx="6" fill="#ff6ec7"/>
    <rect x="108" y="140" width="12" height="35" rx="6" fill="#ff6ec7"/>
    <rect x="70" y="138" width="12" height="35" rx="6" fill="#ff8ed0"/>
    <rect x="98" y="138" width="12" height="35" rx="6" fill="#ff8ed0"/>
    
    {/* Hooves */}
    <ellipse cx="86" cy="175" rx="7" ry="4" fill="#8b2c8b"/>
    <ellipse cx="114" cy="175" rx="7" ry="4" fill="#8b2c8b"/>
    <ellipse cx="76" cy="173" rx="7" ry="4" fill="#8b2c8b"/>
    <ellipse cx="104" cy="173" rx="7" ry="4" fill="#8b2c8b"/>
    
    {/* Tail (flowing) */}
    <path d="M135 115 Q150 120, 155 135 Q152 125, 160 130 Q155 120, 165 125 Q160 115, 170 120" 
          stroke="#d946ef" strokeWidth="10" fill="none" strokeLinecap="round"/>
    <path d="M135 120 Q148 125, 150 140 Q147 130, 155 135" 
          stroke="#ff88ff" strokeWidth="8" fill="none" strokeLinecap="round"/>
    
    {/* Cutie mark (star) */}
    <path d="M100 110 L102 116 L108 116 L103 120 L105 126 L100 122 L95 126 L97 120 L92 116 L98 116 Z" 
          fill="#ffd700" stroke="#ffb300" strokeWidth="1"/>
  </svg>
);

const MajesticUnicornSVG = () => (
  <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body - pearlescent white */}
    <defs>
      <linearGradient id="unicornBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#f0e6ff" />
        <stop offset="100%" stopColor="#ffe6f0" />
      </linearGradient>
      <linearGradient id="unicornHorn" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#ffed4e" />
        <stop offset="100%" stopColor="#fff59d" />
      </linearGradient>
    </defs>
    
    <ellipse cx="100" cy="120" rx="45" ry="35" fill="url(#unicornBody)"/>
    
    {/* Neck */}
    <ellipse cx="75" cy="95" rx="20" ry="28" fill="url(#unicornBody)" transform="rotate(-30 75 95)"/>
    
    {/* Head */}
    <ellipse cx="60" cy="65" rx="28" ry="25" fill="url(#unicornBody)"/>
    
    {/* Snout */}
    <ellipse cx="42" cy="70" rx="14" ry="12" fill="#fff0f5"/>
    
    {/* Majestic Horn - longer and spiral */}
    <path d="M60 50 L57 25 L63 25 Z" fill="url(#unicornHorn)" stroke="#ffd700" strokeWidth="1"/>
    {/* Spiral lines on horn */}
    <path d="M58 30 Q60 35, 58 40" stroke="#ffb300" strokeWidth="1" fill="none"/>
    <path d="M62 30 Q60 35, 62 40" stroke="#ffb300" strokeWidth="1" fill="none"/>
    <path d="M59 45 L61 45" stroke="#ffb300" strokeWidth="1"/>
    
    {/* Magical glow around horn */}
    <circle cx="60" cy="37" r="15" fill="#ffd700" opacity="0.2"/>
    <circle cx="60" cy="37" r="10" fill="#ffffff" opacity="0.3"/>
    
    {/* Ears */}
    <path d="M70 48 L75 38 L72 45 Z" fill="url(#unicornBody)"/>
    <path d="M50 48 L45 38 L48 45 Z" fill="url(#unicornBody)"/>
    
    {/* Magical Mane - flowing and iridescent */}
    <path d="M75 55 Q90 40, 85 25 Q95 35, 100 50 Q105 40, 100 25 Q110 35, 115 55" 
          stroke="#e6b3ff" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.8"/>
    <path d="M75 60 Q85 45, 80 30 Q90 40, 95 55 Q100 45, 95 30" 
          stroke="#ffb3e6" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.8"/>
    <path d="M70 65 Q80 50, 75 35 Q85 45, 90 60" 
          stroke="#b3e6ff" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8"/>
    
    {/* Large magical eye */}
    <ellipse cx="52" cy="65" rx="10" ry="12" fill="white"/>
    <ellipse cx="53" cy="67" rx="7" ry="9" fill="#9b59b6"/>
    <ellipse cx="55" cy="65" rx="3" ry="4" fill="white"/>
    <circle cx="51" cy="63" r="2" fill="white" opacity="0.9"/>
    
    {/* Long eyelashes */}
    <path d="M45 60 L42 57" stroke="#8b2c8b" strokeWidth="2" strokeLinecap="round"/>
    <path d="M47 58 L44 54" stroke="#8b2c8b" strokeWidth="2" strokeLinecap="round"/>
    <path d="M50 57 L48 53" stroke="#8b2c8b" strokeWidth="2" strokeLinecap="round"/>
    
    {/* Legs - slender */}
    <rect x="78" y="140" width="10" height="40" rx="5" fill="url(#unicornBody)"/>
    <rect x="110" y="140" width="10" height="40" rx="5" fill="url(#unicornBody)"/>
    <rect x="68" y="138" width="10" height="40" rx="5" fill="#fff0f5"/>
    <rect x="100" y="138" width="10" height="40" rx="5" fill="#fff0f5"/>
    
    {/* Golden hooves */}
    <ellipse cx="83" cy="180" rx="6" ry="4" fill="#ffd700"/>
    <ellipse cx="115" cy="180" rx="6" ry="4" fill="#ffd700"/>
    <ellipse cx="73" cy="178" rx="6" ry="4" fill="#ffd700"/>
    <ellipse cx="105" cy="178" rx="6" ry="4" fill="#ffd700"/>
    
    {/* Magical flowing tail */}
    <path d="M140 115 Q160 120, 165 140 Q162 125, 175 135 Q170 120, 185 130 Q180 115, 195 125" 
          stroke="#e6b3ff" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.8"/>
    <path d="M140 120 Q155 125, 160 145 Q157 130, 170 140" 
          stroke="#ffb3e6" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.8"/>
    <path d="M140 125 Q150 130, 155 150" 
          stroke="#b3e6ff" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.8"/>
    
    {/* Magical cutie mark - crystal */}
    <path d="M95 105 L100 100 L105 105 L105 115 L100 120 L95 115 Z" 
          fill="#e6b3ff" stroke="#9b59b6" strokeWidth="1"/>
    <path d="M100 100 L100 120 M95 105 L105 115 M105 105 L95 115" 
          stroke="#ffffff" strokeWidth="0.5" opacity="0.6"/>
  </svg>
);

const RainbowDashSVG = () => (
  <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="100" cy="120" rx="45" ry="35" fill="#87ceeb"/>
    
    {/* Neck */}
    <ellipse cx="75" cy="95" rx="20" ry="25" fill="#87ceeb" transform="rotate(-30 75 95)"/>
    
    {/* Head */}
    <ellipse cx="60" cy="70" rx="25" ry="22" fill="#87ceeb"/>
    
    {/* Snout */}
    <ellipse cx="45" cy="75" rx="12" ry="10" fill="#a0d8ef"/>
    
    {/* Ear */}
    <path d="M70 55 L75 45 L72 52 Z" fill="#87ceeb"/>
    
    {/* Rainbow Mane */}
    <path d="M75 60 Q85 45, 80 35" stroke="#ff0000" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M75 62 Q85 47, 80 37" stroke="#ff8800" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M75 64 Q85 49, 80 39" stroke="#ffff00" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M75 66 Q85 51, 80 41" stroke="#00ff00" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M75 68 Q85 53, 80 43" stroke="#0088ff" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M75 70 Q85 55, 80 45" stroke="#8800ff" strokeWidth="3" fill="none" strokeLinecap="round"/>
    
    {/* Wings */}
    <ellipse cx="110" cy="100" rx="30" ry="15" fill="#a0d8ef" transform="rotate(-20 110 100)"/>
    <ellipse cx="115" cy="95" rx="25" ry="12" fill="#b8e0f0" transform="rotate(-25 115 95)"/>
    <ellipse cx="120" cy="90" rx="20" ry="10" fill="#d0e8f8" transform="rotate(-30 120 90)"/>
    
    {/* Eye */}
    <ellipse cx="55" cy="70" rx="8" ry="10" fill="white"/>
    <ellipse cx="56" cy="72" rx="5" ry="7" fill="#d946ef"/>
    <ellipse cx="58" cy="70" rx="2" ry="3" fill="white"/>
    
    {/* Legs */}
    <rect x="80" y="140" width="12" height="35" rx="6" fill="#87ceeb"/>
    <rect x="108" y="140" width="12" height="35" rx="6" fill="#87ceeb"/>
    <rect x="70" y="138" width="12" height="35" rx="6" fill="#a0d8ef"/>
    <rect x="98" y="138" width="12" height="35" rx="6" fill="#a0d8ef"/>
    
    {/* Rainbow Tail */}
    <path d="M135 115 Q150 120, 155 135" stroke="#ff0000" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M135 117 Q150 122, 155 137" stroke="#ff8800" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M135 119 Q150 124, 155 139" stroke="#ffff00" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M135 121 Q150 126, 155 141" stroke="#00ff00" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M135 123 Q150 128, 155 143" stroke="#0088ff" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M135 125 Q150 130, 155 145" stroke="#8800ff" strokeWidth="3" fill="none" strokeLinecap="round"/>
    
    {/* Lightning bolt cutie mark */}
    <path d="M95 110 L100 120 L97 118 L102 128 L95 118 L98 120 Z" 
          fill="#ffd700" stroke="#ff0000" strokeWidth="1"/>
  </svg>
);

const FlyingEmoji = ({ emoji, delay = 0 }: { emoji: string; delay?: number }) => (
  <motion.div
    className="fixed text-4xl pointer-events-none z-50"
    initial={{ 
      x: Math.random() > 0.5 ? -100 : window.innerWidth + 100,
      y: Math.random() * window.innerHeight,
    }}
    animate={{
      x: Math.random() > 0.5 ? window.innerWidth + 100 : -100,
      y: Math.random() * window.innerHeight,
      rotate: [0, 360, 720],
    }}
    transition={{
      duration: 10 + Math.random() * 10,
      repeat: Infinity,
      delay,
      ease: "linear",
    }}
  >
    {emoji}
  </motion.div>
);

const FloatingEmoji = ({ emoji, x, y }: { emoji: string; x: number; y: number }) => (
  <motion.div
    className="fixed text-3xl pointer-events-none z-40"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{
      y: [0, -30, 0],
      rotate: [-10, 10, -10],
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    {emoji}
  </motion.div>
);

export function PonyAnimations() {
  const flyingEmojis = ['🦄', '🌈', '⭐', '✨', '💖', '🎀', '🌸', '🦋', '🌟', '💫'];
  const floatingEmojis = ['💕', '🌺', '🌷', '🌹', '🎪', '🎨', '🎭', '🎠'];

  return (
    <>
      {/* Floating ponies with bounce */}
      <motion.div
        className="fixed pointer-events-none z-50"
        initial={{ x: -100, y: 100 }}
        animate={{
          x: [null, window.innerWidth + 100],
          y: [100, 80, 120, 100],
        }}
        transition={{
          x: { duration: 15, repeat: Infinity, ease: "linear" },
          y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <PonySVG />
        </motion.div>
      </motion.div>

      <motion.div
        className="fixed pointer-events-none z-50"
        initial={{ x: window.innerWidth + 100, y: 300 }}
        animate={{
          x: [null, -100],
          y: [300, 280, 320, 300],
        }}
        transition={{
          x: { duration: 18, repeat: Infinity, ease: "linear", delay: 5 },
          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ transform: 'scaleX(-1)' }}
        >
          <RainbowDashSVG />
        </motion.div>
      </motion.div>

      <motion.div
        className="fixed pointer-events-none z-50"
        initial={{ x: -100, y: 450 }}
        animate={{
          x: [null, window.innerWidth + 100],
          y: [450, 430, 470, 450],
        }}
        transition={{
          x: { duration: 20, repeat: Infinity, ease: "linear", delay: 10 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <motion.div
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <PonySVG />
        </motion.div>
      </motion.div>

      {/* Majestic Unicorn - floating gracefully in the center */}
      <motion.div
        className="fixed pointer-events-none z-50"
        initial={{ x: window.innerWidth / 2 - 50, y: 200 }}
        animate={{
          x: [window.innerWidth / 2 - 50, window.innerWidth / 2 - 100, window.innerWidth / 2 - 50],
          y: [200, 150, 200],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <MajesticUnicornSVG />
        </motion.div>
        
        {/* Magical sparkles around unicorn */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <span className="absolute text-2xl" style={{ top: -20, left: 40 }}>✨</span>
          <span className="absolute text-2xl" style={{ top: 40, left: -10 }}>⭐</span>
          <span className="absolute text-2xl" style={{ top: 80, left: 40 }}>✨</span>
          <span className="absolute text-2xl" style={{ top: 40, left: 90 }}>⭐</span>
        </motion.div>
      </motion.div>

      {/* Flying emojis */}
      {flyingEmojis.map((emoji, i) => (
        <FlyingEmoji key={`flying-${i}`} emoji={emoji} delay={i * 1.5} />
      ))}

      {/* Floating stationary emojis */}
      {floatingEmojis.map((emoji, i) => (
        <FloatingEmoji 
          key={`floating-${i}`} 
          emoji={emoji} 
          x={10 + (i * 12)} 
          y={70 + (i % 3) * 15} 
        />
      ))}

      {/* Sparkle trail effect */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="fixed text-2xl pointer-events-none z-40"
          initial={{ opacity: 0 }}
          animate={{
            x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
            y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        >
          ✨
        </motion.div>
      ))}

      {/* Rainbow arc */}
      <motion.div
        className="fixed text-6xl pointer-events-none z-30 top-10 left-1/2"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🌈
      </motion.div>
    </>
  );
}