/**
 * Log Panel Component
 * Displays adventure action history
 */

import { useGameStore } from '@/hooks/use-game-store';
import { useEffect, useRef } from 'react';

export function LogPanel() {
    const { logs } = useGameStore();
    const logEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs added
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="panel log-panel">
            <div className="panel-title">LOG</div>

            <div className="log-content">
                {logs.length === 0 && (
                    <div className="empty-log">No actions yet...</div>
                )}

                {logs.map((log, index) => (
                    <div key={index} className="log-entry">
                        <span className="log-command">&gt; {log.command}</span>
                        {log.hpChange !== undefined && log.hpChange !== 0 && (
                            <span
                                className={`log-hp ${log.hpChange > 0 ? 'positive' : 'negative'}`}
                            >
                                {log.hpChange > 0 ? '+' : ''}
                                {log.hpChange} HP
                            </span>
                        )}
                        {log.xpGain !== undefined && log.xpGain > 0 && (
                            <span className="log-xp">+{log.xpGain} XP</span>
                        )}
                    </div>
                ))}

                <div ref={logEndRef} />
            </div>
        </div>
    );
}
