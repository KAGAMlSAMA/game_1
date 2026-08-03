import type { Slot } from '../game/types';

interface P {
  className?: string;
}

const S = 'w-full h-full';

export function SwordIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20 L15 9 M13 5 L19 11 M17 3 L21 7 M15 9 L19 11 L21 7 L17 3 Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M4 20 L15 9" />
      <path d="M6 18 L4.5 16.5 M8 20 L6.5 18.5" />
    </svg>
  );
}

export function StaffIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 21 L14 10" />
      <circle cx="17" cy="6" r="3.4" fill="currentColor" fillOpacity="0.3" />
      <path d="M17 1.5 V3 M17 9 V10.5 M12.5 6 H14 M20 6 H21.5" />
    </svg>
  );
}

export function HelmetIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15 a8 8 0 0 1 16 0 v2 H4 Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M4 17 H20 M12 7 V4" />
    </svg>
  );
}

export function ArmorIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4 H10 L12 6 L14 4 H18 V9 C18 14 16 18 12 20 C8 18 6 14 6 9 Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M12 6 V20" />
    </svg>
  );
}

export function GlovesIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 12 V5 a1.6 1.6 0 0 1 3.2 0 V10 V4 a1.6 1.6 0 0 1 3.2 0 V10 V6 a1.6 1.6 0 0 1 3.2 0 V13 c0 4-2 7-5 7 s-5-3-5-6 Z" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

export function BootsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3 H14 V12 C14 12 17 13 19 15 C20 16 20 19 18 19 H8 Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M8 15 H14" />
    </svg>
  );
}

export function SlashIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 18 C8 8 16 5 20 4" />
      <path d="M6 20 C10 12 17 8 21 7" opacity="0.6" />
      <path d="M3 14 L6 17 M18 3 L21 6" />
    </svg>
  );
}

export function SpinIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 4 A8 8 0 1 1 4 12" />
      <path d="M4 12 L2 9 M4 12 L7 10" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function RageIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 C14 7 18 8 18 13 a6 6 0 0 1 -12 0 C6 9 9 8 9 5 C10.5 6.5 11 8 11 9.5 C12.8 8 12.5 5 12 3 Z" fill="currentColor" fillOpacity="0.3" />
    </svg>
  );
}

export function FireIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 C13 8 19 9 19 14 a7 7 0 0 1 -14 0 C5 10 10 9 10 5 C11 6.6 11.4 8 11 10 C13 9 12.6 5.5 12 3 Z" fill="currentColor" fillOpacity="0.3" />
      <circle cx="12" cy="15" r="2" fill="currentColor" />
    </svg>
  );
}

export function IceIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2 V22 M4 6 L20 18 M20 6 L4 18" />
      <path d="M12 5 L10 7 M12 5 L14 7 M12 19 L10 17 M12 19 L14 17" />
    </svg>
  );
}

export function ThunderIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M13 2 L5 13 H11 L9 22 L19 9 H13 Z" fill="currentColor" fillOpacity="0.35" />
    </svg>
  );
}

export function FlyIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15 L18 6 L21 3 L19 8 L6 18 Z" fill="currentColor" fillOpacity="0.3" />
      <path d="M2 19 H9 M4 22 H12" opacity="0.8" />
      <path d="M13 4 a5 5 0 0 1 4 -2" opacity="0.6" />
    </svg>
  );
}

export function BlinkIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="6.5" cy="12" r="3.2" opacity="0.45" />
      <circle cx="17.5" cy="12" r="3.6" fill="currentColor" fillOpacity="0.3" />
      <path d="M10.5 12 H14" strokeDasharray="2 2.4" />
      <path d="M17.5 5 V2.5 M17.5 21.5 V19 M21 8.5 L22.6 7 M21 15.5 L22.6 17" opacity="0.7" />
    </svg>
  );
}

export function RealmIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" fill="currentColor" fillOpacity="0.14" />
      <path d="M12 3.5 a4.25 4.25 0 0 0 0 8.5 a4.25 4.25 0 0 1 0 8.5" />
      <circle cx="12" cy="7.7" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16.3" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AttackIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 21 L14 10" />
      <path d="M12 4 L20 12 M17 3 L21 7" />
      <path d="M5 15 L3 13 M9 19 L7 21" opacity="0.6" />
    </svg>
  );
}

export function HpPotionIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3 H14 V7 L17 12 C19 15 18 20 12 20 C6 20 5 15 7 12 L10 7 Z" fill="#ff5b6a" fillOpacity="0.75" stroke="#ffd0d6" />
      <path d="M10 3 H14" />
      <path d="M9.5 13 a2.5 2.5 0 0 0 2 3" stroke="#fff" opacity="0.8" />
    </svg>
  );
}

export function MpPotionIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3 H14 V7 L17 12 C19 15 18 20 12 20 C6 20 5 15 7 12 L10 7 Z" fill="#4aa3ff" fillOpacity="0.75" stroke="#cfe6ff" />
      <path d="M10 3 H14" />
      <path d="M9.5 13 a2.5 2.5 0 0 0 2 3" stroke="#fff" opacity="0.8" />
    </svg>
  );
}

export function CoinIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none">
      <circle cx="12" cy="12" r="9" fill="#ffd94a" stroke="#8a5a12" strokeWidth="2" />
      <circle cx="12" cy="12" r="5.5" fill="none" stroke="#c9930f" strokeWidth="1.6" />
      <path d="M12 8.5 V15.5 M9.5 10.5 H14.5" stroke="#8a5a12" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LeafIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="currentColor">
      <path d="M12 2 L14 7 L19 5 L17.5 10 L22 12 L17.5 14 L19 19 L14 17.5 L12 22 L10 17.5 L5 19 L6.5 14 L2 12 L6.5 10 L5 5 L10 7 Z" opacity="0.9" />
      <circle cx="12" cy="12" r="2.6" fill="#8a3a1a" />
    </svg>
  );
}

export function BagIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8 H19 L18 20 H6 Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M8 8 V6 a4 4 0 0 1 8 0 V8" />
    </svg>
  );
}

export function BookIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5 C7 3.5 10 3.5 12 5.5 C14 3.5 17 3.5 20 5 V19 C17 17.5 14 17.5 12 19.5 C10 17.5 7 17.5 4 19 Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M12 5.5 V19.5" />
    </svg>
  );
}

export function StatsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 20 V12 M12 20 V4 M19 20 V9" />
      <circle cx="5" cy="9" r="2" fill="currentColor" />
      <circle cx="19" cy="6" r="2" fill="currentColor" />
    </svg>
  );
}

export function MapIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M9 4 V18 M15 6 V20" />
    </svg>
  );
}

export function SoundOnIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9 H8 L13 4 V20 L8 15 H4 Z" fill="currentColor" fillOpacity="0.3" />
      <path d="M16 9 a4 4 0 0 1 0 6 M18.5 6.5 a8 8 0 0 1 0 11" />
    </svg>
  );
}

export function SoundOffIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9 H8 L13 4 V20 L8 15 H4 Z" fill="currentColor" fillOpacity="0.3" />
      <path d="M16 9 L22 15 M22 9 L16 15" />
    </svg>
  );
}

export function ConsoleIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor" fillOpacity="0.2" />
      <path d="M7 9 L11 12 L7 16" />
      <path d="M13 16 H17" />
    </svg>
  );
}

export function PauseIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1.5" />
      <rect x="14" y="4" width="4" height="16" rx="1.5" />
    </svg>
  );
}

export function CloseIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </svg>
  );
}

export function LockIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" fillOpacity="0.25" />
      <path d="M8 11 V8 a4 4 0 0 1 8 0 V11" />
    </svg>
  );
}

export function SkullIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 a8 8 0 0 1 8 8 c0 3-2 4.5-3 5.5 V20 H7 V16.5 C6 15.5 4 14 4 11 A8 8 0 0 1 12 3 Z" fill="currentColor" fillOpacity="0.2" />
      <circle cx="9" cy="11" r="1.8" fill="currentColor" />
      <circle cx="15" cy="11" r="1.8" fill="currentColor" />
      <path d="M10 20 V17 M14 20 V17" />
    </svg>
  );
}

export function CrownIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="currentColor">
      <path d="M3 8 L7 12 L12 5 L17 12 L21 8 L19.5 18 H4.5 Z" />
      <rect x="4.5" y="18" width="15" height="2.6" rx="1" />
    </svg>
  );
}

export function WarriorPortrait({ className }: P) {
  return (
    <svg viewBox="0 0 48 48" className={className ?? S}>
      <circle cx="24" cy="26" r="15" fill="#ffe0bd" />
      <path d="M9 24 a15 15 0 0 1 30 0 l0 -4 a15 15 0 0 0 -30 0 Z" fill="#8a4a22" />
      <path d="M11 18 L15 8 L19 16 L24 6 L29 16 L33 8 L37 18 Z" fill="#8a4a22" />
      <rect x="9" y="18" width="30" height="4.5" rx="2" fill="#e03a3a" />
      <circle cx="19" cy="27" r="2.4" fill="#1c1c28" />
      <circle cx="29" cy="27" r="2.4" fill="#1c1c28" />
      <path d="M20 34 q4 3 8 0" stroke="#b06a4a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M36 34 L46 24 L43 21 L33 31 Z" fill="#c8d4e8" stroke="#8a9ab8" />
    </svg>
  );
}

export function MagePortrait({ className }: P) {
  return (
    <svg viewBox="0 0 48 48" className={className ?? S}>
      <circle cx="24" cy="27" r="15" fill="#ffe0bd" />
      <path d="M8 26 a16 16 0 0 1 32 0 l-2 10 -4 -8 -4 6 -4 -7 -4 7 -4 -6 -4 8 Z" fill="#3d4da3" />
      <path d="M10 20 Q24 12 34 18 L42 4 Q28 10 10 20 Z" fill="#7b4fd0" />
      <circle cx="42" cy="5" r="3" fill="#ffd97a" />
      <circle cx="19" cy="28" r="2.4" fill="#1c1c28" />
      <circle cx="29" cy="28" r="2.4" fill="#1c1c28" />
      <path d="M20 35 q4 3 8 0" stroke="#b06a4a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="30" r="5" fill="#7de8ff" opacity="0.85" />
    </svg>
  );
}

export function MouseLeftIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="7" y="3" width="10" height="18" rx="5" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 3 V10 H7 V8 a5 5 0 0 1 5 -5 Z" fill="currentColor" />
      <path d="M7 10 H17" />
    </svg>
  );
}

export function MouseRightIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="7" y="3" width="10" height="18" rx="5" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 3 V10 H17 V8 a5 5 0 0 0 -5 -5 Z" fill="currentColor" />
      <path d="M7 10 H17" />
    </svg>
  );
}

export function RopeIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2 V22" />
      <path d="M9 6 L15 8 M9 11 L15 13 M9 16 L15 18" opacity="0.75" />
    </svg>
  );
}

/** 乾坤珠：一颗紫金流光球体 */
export function QiankunBeadIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S}>
      <defs>
        <radialGradient id="qkbG" cx="35%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#e0b6ff" />
          <stop offset="75%" stopColor="#8f4fd8" />
          <stop offset="100%" stopColor="#3a1a5c" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12.4" r="8.6" fill="url(#qkbG)" stroke="#c06bff" strokeWidth="1" />
      <ellipse cx="9" cy="9.5" rx="3.2" ry="1.9" fill="rgba(255,255,255,0.7)" />
      <path d="M15 15 A6 6 0 0 1 9 18" stroke="rgba(255,220,255,0.55)" strokeWidth="1" fill="none" />
      <circle cx="12" cy="12.4" r="1.4" fill="#fff6c8" />
    </svg>
  );
}

/** 青竹剑：竹身细剑 + 旋转环绕点缀 */
export function BambooSwordIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.4" stroke="rgba(122,224,106,0.35)" strokeDasharray="2 3" />
      <path d="M12 2 L12 19" stroke="#3f8f4f" strokeWidth="2.6" />
      <path d="M12 2 L12 19" stroke="#c6f5b3" strokeWidth="1" />
      <path d="M9 6 H15 M9 10 H15 M9 14 H15" stroke="rgba(45,90,55,0.9)" strokeWidth="1.1" />
      <path d="M9.5 20 H14.5" stroke="#6e4526" strokeWidth="2.6" />
      <path d="M11 22 H13" stroke="#c6f5b3" strokeWidth="1.6" />
      <circle cx="4" cy="8" r="1.2" fill="#7ae06a" stroke="none" />
      <circle cx="20" cy="16" r="1.2" fill="#7ae06a" stroke="none" />
    </svg>
  );
}

/** 通用法宝图标：按 artifactId 分派 */
export function ArtifactIcon({ id, className }: { id?: string; className?: string }) {
  switch (id) {
    case 'qiankun_bead': return <QiankunBeadIcon className={className} />;
    case 'green_bamboo_sword': return <BambooSwordIcon className={className} />;
    default:
      // 默认给一个通用「法宝」标志（八卦纹）
      return (
        <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3 a4.5 4.5 0 0 0 0 9 a4.5 4.5 0 0 1 0 9" />
          <circle cx="12" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="16.5" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

export function SlotIcon({ slot, className, artifactId }: { slot: Slot; className?: string; artifactId?: string }) {
  switch (slot) {
    case 'weapon': return <SwordIcon className={className} />;
    case 'helmet': return <HelmetIcon className={className} />;
    case 'armor': return <ArmorIcon className={className} />;
    case 'gloves': return <GlovesIcon className={className} />;
    case 'shoes': return <BootsIcon className={className} />;
    case 'artifact': return <ArtifactIcon id={artifactId} className={className} />;
  }
}

export function GiantSwordIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2.5 L21.5 9.5 L9.5 21.5 L2.5 14.5 Z" fill="currentColor" fillOpacity="0.3" />
      <path d="M14.5 2.5 L21.5 9.5 M9.5 21.5 L2.5 14.5" />
      <path d="M6 18 L18 6" />
      <path d="M2 22 L5 19" />
    </svg>
  );
}

export function FlyingSwordsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 3 L12 10 M12 3 L19 10" />
      <path d="M3 14 L10 21 M10 14 L17 21" />
      <path d="M8 8 L16 16" strokeDasharray="1.5 2" />
    </svg>
  );
}

export function DashSlashIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? S} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12 H16" opacity="0.5" strokeDasharray="2 2.5" />
      <path d="M9 6 L21 12 L9 18" fill="currentColor" fillOpacity="0.25" />
      <path d="M13 8 L21 12 L13 16" />
    </svg>
  );
}

export function SkillIcon({ kind, className }: { kind: string; className?: string }) {
  switch (kind) {
    case 'dash': return <DashSlashIcon className={className} />;
    case 'melee': return <SlashIcon className={className} />;
    case 'spin': return <SpinIcon className={className} />;
    case 'buff': return <RageIcon className={className} />;
    case 'fire': return <FireIcon className={className} />;
    case 'ice': return <IceIcon className={className} />;
    case 'thunder': return <ThunderIcon className={className} />;
    case 'fly': return <FlyIcon className={className} />;
    case 'blink': return <BlinkIcon className={className} />;
    case 'giant_sword': return <GiantSwordIcon className={className} />;
    case 'flying_swords': return <FlyingSwordsIcon className={className} />;
    default: return <AttackIcon className={className} />;
  }
}
