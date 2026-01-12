/**
 * Stats Panel Component
 * Displays HP, EXP, and CHRONO (time) information
 */

import { useGameStore } from '@/hooks/use-game-store';

export function StatsPanel() {
    const { hp, maxHp, xp, day, timeOfDay } = useGameStore();

    const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 0;

    return (
        <div className="panel stats-panel">
            <div className="panel-title">STATS</div>

            <div className="stat-row">
                <div className="stat-label">HP</div>
                <div className="hp-bar-container">
                    <div className="hp-bar-bg">
                        <div
                            className="hp-bar-fill"
                            style={{ width: `${hpPercentage}%` }}
                        />
                    </div>
                    <div className="hp-text">
                        {hp}/{maxHp}
                    </div>
                </div>
            </div>

            <div className="stat-row">
                <div className="stat-label">EXP</div>
                <div className="stat-value">{xp}</div>
            </div>

            <div className="stat-row">
                <div className="stat-label">CHRONO</div>
                <div className="stat-value chrono">
                    <div>DAY {day}</div>
                    <div className="time-of-day">{timeOfDay.toUpperCase()}</div>
                </div>
            </div>
        </div>
    );
}
