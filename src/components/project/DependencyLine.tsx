import React from 'react';
import { TaskDependency, Task } from '@/types';

interface DependencyLineProps {
    dependency: TaskDependency;
    tasks: Task[];
    startDate: Date;
    dayWidth: number;
    predecessorY: number;
    successorY: number;
}

export const DependencyLine: React.FC<DependencyLineProps> = ({
    dependency,
    tasks,
    startDate,
    dayWidth,
    predecessorY,
    successorY
}) => {
    const predecessor = tasks.find(t => t.id === dependency.predecessorId);
    const successor = tasks.find(t => t.id === dependency.successorId);

    if (!predecessor || !successor) return null;

    const predEnd = predecessor.endDate?.toDate() || new Date();
    const succStart = successor.startDate?.toDate() || new Date();

    const predX = (predEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) * dayWidth;
    const succX = (succStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) * dayWidth;

    // Calculate control points for curved line
    const midX = (predX + succX) / 2;
    const curveOffset = Math.abs(successorY - predecessorY) * 0.3;

    // Different line styles based on dependency type
    const getLineStyle = () => {
        switch (dependency.type) {
            case 'FS':
                return { stroke: '#666', strokeWidth: 1, strokeDasharray: 'none' };
            case 'SS':
                return { stroke: '#4A90E2', strokeWidth: 1, strokeDasharray: '5,5' };
            case 'FF':
                return { stroke: '#E94B3C', strokeWidth: 1, strokeDasharray: '10,5' };
            case 'SF':
                return { stroke: '#F5A623', strokeWidth: 1, strokeDasharray: '15,5,5,5' };
            default:
                return { stroke: '#666', strokeWidth: 1, strokeDasharray: 'none' };
        }
    };

    const lineStyle = getLineStyle();

    // Create path based on dependency type
    let pathData: string;
    switch (dependency.type) {
        case 'FS':
            pathData = `M ${predX} ${predecessorY} L ${midX} ${predecessorY} L ${midX} ${successorY} L ${succX} ${successorY}`;
            break;
        case 'SS':
            const startPredX = (predecessor.startDate?.toDate().getTime() || predEnd.getTime() - (predecessor.duration || 1) * 24 * 60 * 60 * 1000 - startDate.getTime()) / (1000 * 60 * 60 * 24) * dayWidth;
            const startSuccX = (successor.startDate?.toDate().getTime() || succStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) * dayWidth;
            pathData = `M ${startPredX} ${predecessorY} L ${midX} ${predecessorY} L ${midX} ${successorY} L ${startSuccX} ${successorY}`;
            break;
        case 'FF':
            pathData = `M ${predX} ${predecessorY} L ${midX} ${predecessorY} L ${midX} ${successorY} L ${succX} ${successorY}`;
            break;
        case 'SF':
            const startPredX2 = (predecessor.startDate?.toDate().getTime() || predEnd.getTime() - (predecessor.duration || 1) * 24 * 60 * 60 * 1000 - startDate.getTime()) / (1000 * 60 * 60 * 24) * dayWidth;
            pathData = `M ${startPredX2} ${predecessorY} L ${midX} ${predecessorY} L ${midX} ${successorY} L ${succX} ${successorY}`;
            break;
        default:
            pathData = `M ${predX} ${predecessorY} L ${midX} ${predecessorY} L ${midX} ${successorY} L ${succX} ${successorY}`;
    }

    return (
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
            <path
                d={pathData}
                stroke={lineStyle.stroke}
                strokeWidth={lineStyle.strokeWidth}
                fill="none"
                strokeDasharray={lineStyle.strokeDasharray}
                markerEnd="url(#arrowhead)"
            />
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={lineStyle.stroke} />
                </marker>
            </defs>
        </svg>
    );
};

export default DependencyLine;