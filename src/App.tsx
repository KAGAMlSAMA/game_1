import { useEffect, useRef, useState } from 'react';
import type { Appearance, ClassId, Snapshot, SpiritualRoots } from './game/types';
import { defaultAppearance, generateSpiritualRoots } from './game/data';
import { Engine } from './game/engine';
import StartScreen from './components/StartScreen';
import HUD, { type PanelId } from './components/HUD';
import { PanelRoot, PauseMenu, DeathOverlay, VictoryOverlay, NpcPanel } from './components/Panels';
import { sfx } from './game/audio';

function GameView({
  classId, name, appearance, roots, onQuit,
}: {
  classId: ClassId;
  name: string;
  appearance: Appearance;
  roots: SpiritualRoots;
  onQuit: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [panel, setPanel] = useState<PanelId>(null);
  const panelRef = useRef<PanelId>(null);
  const [pauseOpen, setPauseOpen] = useState(false);

  const applyPanel = (p: PanelId) => {
    panelRef.current = p;
    setPanel(p);
    if (p) sfx.ui();
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const eng = new Engine(cv, classId, name, appearance, roots);
    engineRef.current = eng;
    const unsub = eng.subscribe((s) => setSnap(s));
    return () => {
      unsub();
      eng.destroy();
      engineRef.current = null;
    };
  }, [classId, name, appearance, roots]);

  const npcOpen = !!snap?.npcView;

  useEffect(() => {
    engineRef.current?.setUiPaused(panel !== null || pauseOpen || npcOpen);
  }, [panel, pauseOpen, npcOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const c = e.code;
      if (c === 'Escape') {
        const eg = engineRef.current;
        if (eg?.getSnapshot().npcView) { eg.closeNpc(); return; }
        if (panelRef.current) applyPanel(null);
        else setPauseOpen((o) => !o);
      } else if (c === 'KeyC') applyPanel(panelRef.current === 'stats' ? null : 'stats');
      else if (c === 'KeyI') applyPanel(panelRef.current === 'inventory' ? null : 'inventory');
      else if (c === 'KeyK') applyPanel(panelRef.current === 'skills' ? null : 'skills');
      else if (c === 'KeyM') applyPanel(panelRef.current === 'map' ? null : 'map');
    };
    const onCheat = () => engineRef.current?.cheatMode();

    window.addEventListener('keydown', onKey);
    window.addEventListener('author-cheat', onCheat);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('author-cheat', onCheat);
    };
  }, []);

  const eng = () => engineRef.current;

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-[#0a0f22]" onContextMenu={(e) => e.preventDefault()}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {snap && (
        <>
          <HUD
            snap={snap}
            panel={panel}
            onPanel={applyPanel}
            onMute={() => eng()?.toggleMute()}
            onPause={() => setPauseOpen(true)}
          />
          <PanelRoot
            panel={panel}
            snap={snap}
            onClose={() => applyPanel(null)}
            onEquipSkill={(slot, skillId) => eng()?.equipSkillToSlot(slot, skillId)}
            onSetBeadSkill={(skillId) => eng()?.setBeadSkill(skillId)}
            onLearnBook={(i) => eng()?.learnSkillBook(i)}
            onEquip={(i) => eng()?.equipAt(i)}
            onUnequip={(s) => eng()?.unequipSlot(s)}
            onTravel={(id) => {
              eng()?.travelTo(id);
              applyPanel(null);
            }}
            onLearnSkillDirectly={(skillId) => eng()?.learnSkillDirectly(skillId)}
            onLearnAllSkillsDirectly={() => eng()?.learnAllSkillsDirectly()}
            onSpawnEnemyDirectly={(enemyId) => eng()?.spawnEnemyDirectly(enemyId)}
            onClearEnemiesDirectly={() => eng()?.clearEnemiesDirectly()}
            onGrantArtifactDirectly={(artifactId) => eng()?.grantArtifactDirectly(artifactId)}
          />
          {snap.npcView && !snap.dead && (
            <NpcPanel
              snap={snap}
              onNext={() => eng()?.npcNext()}
              onClose={() => eng()?.closeNpc()}
              onBuy={(id) => eng()?.buyShopItem(id)}
            />
          )}
          {snap.dead && <DeathOverlay onRespawn={() => eng()?.respawn()} />}
          {snap.victory && !snap.dead && <VictoryOverlay onContinue={() => eng()?.ackVictory()} />}
          {pauseOpen && !snap.dead && (
            <PauseMenu onResume={() => setPauseOpen(false)} onQuit={onQuit} />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<'start' | 'game'>('start');
  const [cls, setCls] = useState<ClassId>('warrior');
  const [name, setName] = useState('无名散修');
  const [look, setLook] = useState<Appearance>(defaultAppearance('warrior'));
  const [roots, setRoots] = useState<SpiritualRoots>(() => generateSpiritualRoots());

  if (screen === 'game') {
    return (
      <GameView
        classId={cls}
        name={name}
        appearance={look}
        roots={roots}
        onQuit={() => setScreen('start')}
      />
    );
  }
  return (
    <StartScreen
      onStart={(c, n, a, r) => {
        sfx.ensure();
        sfx.levelup();
        sfx.startMusic();
        setCls(c);
        setName(n);
        setLook(a);
        setRoots(r);
        setScreen('game');
      }}
    />
  );
}
