/**
 * MuscleMap — Visual body map showing which muscles were trained.
 * Uses SVG paths for front/back body with highlighted muscle groups.
 * Color coding: Gold (frequent), Bronze (moderate), Wood (light), Dark (inactive)
 */

import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'core' | 'quads' | 'hamstrings' | 'glutes'
  | 'calves' | 'traps' | 'lats' | 'rear_delts';

export type MuscleActivation = {
  group: MuscleGroup;
  level: 'gold' | 'bronze' | 'wood' | 'none';
};

type MuscleMapProps = {
  muscles: MuscleActivation[];
};

const MUSCLE_COLORS = {
  gold: '#FFD700',
  bronze: '#CD7F32',
  wood: '#8B6914',
  none: '#2A2D2B',
};

const MUSCLE_MAP: Record<MuscleGroup, { front?: string; back?: string }> = {
  chest: { front: 'M140,120 Q150,110 160,120 L165,145 Q155,155 140,145 Z' },
  shoulders: {
    front: 'M125,105 Q130,95 140,100 L140,115 Q130,115 125,105 Z M160,100 Q170,95 175,105 L170,115 Q160,115 160,100 Z',
    back: 'M128,105 Q135,95 142,100 L142,112 Q132,112 128,105 Z M158,100 Q165,95 172,105 L168,112 Q158,112 158,100 Z',
  },
  biceps: {
    front: 'M118,120 Q115,135 118,150 L128,148 Q130,135 128,120 Z M172,120 Q175,135 172,150 L162,148 Q160,135 162,120 Z',
  },
  triceps: {
    back: 'M118,120 Q115,135 118,150 L128,148 Q130,135 128,120 Z M172,120 Q175,135 172,150 L162,148 Q160,135 162,120 Z',
  },
  back: {
    back: 'M138,115 Q150,110 162,115 L165,155 Q155,160 145,155 Z',
  },
  lats: {
    back: 'M130,120 Q135,115 140,120 L138,150 Q132,145 130,120 Z M160,120 Q165,115 170,120 L170,150 Q168,145 160,120 Z',
  },
  traps: {
    back: 'M140,95 Q150,90 160,95 L162,115 Q155,118 148,115 Z',
  },
  rear_delts: {
    back: 'M128,100 Q135,92 142,98 L140,110 Q132,108 128,100 Z M158,98 Q165,92 172,100 L170,110 Q162,108 158,98 Z',
  },
  core: {
    front: 'M142,145 Q150,142 158,145 L160,175 Q150,180 140,175 Z',
  },
  forearms: {
    front: 'M112,152 Q108,168 112,182 L122,180 Q126,168 122,152 Z M178,152 Q182,168 178,182 L168,180 Q164,168 168,152 Z',
  },
  quads: {
    front: 'M135,180 Q140,175 148,180 L148,225 Q142,228 138,225 Z M152,180 Q158,175 165,180 L162,225 Q158,228 152,225 Z',
  },
  hamstrings: {
    back: 'M135,175 Q142,170 148,175 L148,220 Q142,222 138,218 Z M152,175 Q158,170 165,175 L162,218 Q158,222 152,175 Z',
  },
  glutes: {
    back: 'M132,155 Q150,148 168,155 L165,178 Q150,182 135,178 Z',
  },
  calves: {
    front: 'M138,228 Q142,225 148,228 L146,268 Q142,272 138,268 Z M152,228 Q158,225 162,228 L162,268 Q158,272 154,268 Z',
    back: 'M138,225 Q142,222 148,225 L146,265 Q142,268 138,265 Z M152,225 Q158,222 162,225 L162,265 Q158,268 154,265 Z',
  },
};

export function MuscleMap({ muscles }: MuscleMapProps) {
  const getMuscleColor = (group: MuscleGroup) => {
    const found = muscles.find((m) => m.group === group);
    return found ? MUSCLE_COLORS[found.level] : MUSCLE_COLORS.none;
  };

  const frontMuscles: MuscleGroup[] = [
    'chest', 'shoulders', 'biceps', 'core', 'forearms', 'quads', 'calves',
  ];
  const backMuscles: MuscleGroup[] = [
    'traps', 'rear_delts', 'back', 'lats', 'triceps', 'glutes', 'hamstrings', 'calves',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bodyContainer}>
        {/* Front View */}
        <View style={styles.bodyView}>
          <ThemedText type="small" themeColor="textMuted" style={styles.viewLabel}>Front</ThemedText>
          <View style={styles.bodyOutline}>
            {/* Body outline */}
            <View style={styles.bodyShape}>
              {/* Head */}
              <View style={[styles.head, { borderColor: '#3A3D3B' }]} />
              {/* Torso */}
              <View style={[styles.torso, { borderColor: '#3A3D3B' }]} />
              {/* Left arm */}
              <View style={[styles.arm, styles.leftArm, { borderColor: '#3A3D3B' }]} />
              {/* Right arm */}
              <View style={[styles.arm, styles.rightArm, { borderColor: '#3A3D3B' }]} />
              {/* Left leg */}
              <View style={[styles.leg, styles.leftLeg, { borderColor: '#3A3D3B' }]} />
              {/* Right leg */}
              <View style={[styles.leg, styles.rightLeg, { borderColor: '#3A3D3B' }]} />

              {/* Muscle highlights */}
              {frontMuscles.map((group) => (
                <View
                  key={group}
                  style={[
                    styles.muscleHighlight,
                    getMusclePosition(group, 'front'),
                    { backgroundColor: getMuscleColor(group) },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Back View */}
        <View style={styles.bodyView}>
          <ThemedText type="small" themeColor="textMuted" style={styles.viewLabel}>Back</ThemedText>
          <View style={styles.bodyOutline}>
            <View style={styles.bodyShape}>
              {/* Head */}
              <View style={[styles.head, { borderColor: '#3A3D3B' }]} />
              {/* Torso */}
              <View style={[styles.torso, { borderColor: '#3A3D3B' }]} />
              {/* Left arm */}
              <View style={[styles.arm, styles.leftArm, { borderColor: '#3A3D3B' }]} />
              {/* Right arm */}
              <View style={[styles.arm, styles.rightArm, { borderColor: '#3A3D3B' }]} />
              {/* Left leg */}
              <View style={[styles.leg, styles.leftLeg, { borderColor: '#3A3D3B' }]} />
              {/* Right leg */}
              <View style={[styles.leg, styles.rightLeg, { borderColor: '#3A3D3B' }]} />

              {/* Muscle highlights */}
              {backMuscles.map((group) => (
                <View
                  key={group}
                  style={[
                    styles.muscleHighlight,
                    getMusclePosition(group, 'back'),
                    { backgroundColor: getMuscleColor(group) },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function getMusclePosition(group: MuscleGroup, view: 'front' | 'back'): object {
  const positions: Record<string, Record<string, object>> = {
    front: {
      chest: { top: '28%', left: '35%', width: '30%', height: '10%' },
      shoulders: { top: '20%', left: '15%', width: '70%', height: '8%' },
      biceps: { top: '28%', left: '8%', width: '12%', height: '18%' },
      core: { top: '42%', left: '35%', width: '30%', height: '15%' },
      forearms: { top: '48%', left: '4%', width: '10%', height: '16%' },
      quads: { top: '58%', left: '28%', width: '16%', height: '28%' },
      calves: { top: '82%', left: '30%', width: '14%', height: '16%' },
    },
    back: {
      traps: { top: '18%', left: '35%', width: '30%', height: '8%' },
      rear_delts: { top: '20%', left: '18%', width: '28%', height: '8%' },
      back: { top: '26%', left: '35%', width: '30%', height: '14%' },
      lats: { top: '28%', left: '22%', width: '56%', height: '12%' },
      triceps: { top: '28%', left: '8%', width: '12%', height: '18%' },
      glutes: { top: '48%', left: '28%', width: '44%', height: '12%' },
      hamstrings: { top: '58%', left: '28%', width: '16%', height: '28%' },
      calves: { top: '82%', left: '30%', width: '14%', height: '16%' },
    },
  };
  return positions[view]?.[group] || {};
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  bodyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bodyView: {
    alignItems: 'center',
    width: '45%',
  },
  viewLabel: {
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bodyOutline: {
    width: 120,
    height: 200,
  },
  bodyShape: {
    flex: 1,
    position: 'relative',
  },
  head: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#1A1D1B',
  },
  torso: {
    position: 'absolute',
    top: 28,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#1A1D1B',
  },
  arm: {
    position: 'absolute',
    top: 28,
    width: 16,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#1A1D1B',
  },
  leftArm: {
    left: 4,
  },
  rightArm: {
    right: 4,
  },
  leg: {
    position: 'absolute',
    top: 88,
    width: 20,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#1A1D1B',
  },
  leftLeg: {
    left: '50%',
    marginLeft: -22,
  },
  rightLeg: {
    right: '50%',
    marginRight: -22,
  },
  muscleHighlight: {
    position: 'absolute',
    borderRadius: 4,
    opacity: 0.8,
  },
});
