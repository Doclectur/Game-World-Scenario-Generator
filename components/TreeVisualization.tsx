import React, { useState, useEffect, useMemo } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Branch {
  id: number;
  path: string;
  endPoint: Point;
  type: 'trunk' | 'chosen' | 'unchosen';
}

interface TreeVisualizationProps {
  branchLevel: number;
  isBlooming: boolean;
}

const TreeVisualization: React.FC<TreeVisualizationProps> = ({ branchLevel, isBlooming }) => {
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    // Initialize with a trunk, and reset when the journey restarts (branchLevel becomes 0)
    if (branchLevel === 0) {
      const trunk: Branch = {
        id: Date.now(), // Use a unique key to ensure re-render and animation reset
        path: 'M 50 100 V 85',
        endPoint: { x: 50, y: 85 },
        type: 'trunk',
      };
      setBranches([trunk]);
    }
  }, [branchLevel]);

  useEffect(() => {
    const chosenBranchesCount = branches.filter(b => b.type === 'chosen').length;

    if (branchLevel > 0 && branchLevel > chosenBranchesCount) {
      const parentBranch = branches.filter(b => b.type === 'chosen' || b.type === 'trunk').pop();
      if (!parentBranch) return;

      const startPoint = parentBranch.endPoint;
      const newBranches: Branch[] = [];

      // Create the main "chosen" branch for the current level
      const mainAngle = (Math.random() - 0.5) * 90 - 90; // Upwards angle
      const mainLength = 10 + Math.random() * 5;
      const mainEndPoint: Point = {
        x: startPoint.x + mainLength * Math.cos(mainAngle * (Math.PI / 180)),
        y: startPoint.y + mainLength * Math.sin(mainAngle * (Math.PI / 180)),
      };
      const mainControlPoint: Point = {
          x: (startPoint.x + mainEndPoint.x) / 2 + (Math.random() - 0.5) * 15,
          y: (startPoint.y + mainEndPoint.y) / 2 + (Math.random() - 0.5) * 15,
      };
      const mainPathData = `M ${startPoint.x} ${startPoint.y} Q ${mainControlPoint.x} ${mainControlPoint.y} ${mainEndPoint.x} ${mainEndPoint.y}`;
      
      newBranches.push({
        id: Date.now() + Math.random(),
        path: mainPathData,
        endPoint: mainEndPoint,
        type: 'chosen',
      });

      // Create several "unchosen" branches
      const numUnchosen = 2 + Math.floor(Math.random() * 3); // 2 to 4
      for (let i = 0; i < numUnchosen; i++) {
        const angle = (Math.random() - 0.5) * 120 - 90;
        const length = 5 + Math.random() * 5;
        const endPoint: Point = {
          x: startPoint.x + length * Math.cos(angle * (Math.PI / 180)),
          y: startPoint.y + length * Math.sin(angle * (Math.PI / 180)),
        };
        const controlPoint: Point = {
          x: (startPoint.x + endPoint.x) / 2 + (Math.random() - 0.5) * 10,
          y: (startPoint.y + endPoint.y) / 2 + (Math.random() - 0.5) * 10,
        };
        const pathData = `M ${startPoint.x} ${startPoint.y} Q ${controlPoint.x} ${controlPoint.y} ${endPoint.x} ${endPoint.y}`;

        newBranches.push({
          id: Date.now() + Math.random(),
          path: pathData,
          endPoint: endPoint,
          type: 'unchosen',
        });
      }
      setBranches(prev => [...prev, ...newBranches]);
    }
  }, [branchLevel, branches]);
  
  const bloomStartPoint = useMemo(() => {
    return branches.filter(b => b.type === 'chosen').pop()?.endPoint ?? null;
  }, [branches]);

  return (
    <>
      <style>{`
        .branch-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: draw 2.5s ease-out forwards;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        .branch-trunk, .branch-chosen {
          stroke: rgba(252, 165, 3, 0.8); /* Gold */
          stroke-width: 0.6;
        }
        .branch-unchosen {
          stroke: rgba(252, 165, 3, 0.3); /* Dimmer Gold */
          stroke-width: 0.3;
        }

        .bloom-seed {
            fill: white;
            animation: travel 0.8s cubic-bezier(0.5, 0, 0.8, 0.5) forwards;
        }
        @keyframes travel {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.5); opacity: 0; }
        }

        .bloom-bundle {
            opacity: 0;
            animation: show-bundle 0.1s 0.8s forwards; /* Delay matches seed travel time */
        }
        @keyframes show-bundle {
            to { opacity: 1; }
        }

        .petal {
            stroke: rgba(255, 191, 0, 1); /* Brighter Gold */
            stroke-width: 0.3;
            fill: rgba(252, 165, 3, 0.2); /* Gold fill */
            transform-origin: center center;
            animation: unfurl 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes unfurl {
            0% { transform: scale(0); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
      <svg
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <filter id="svg-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g fill="none" filter="url(#svg-glow)">
          {branches.map((branch) => (
            <path
              key={branch.id}
              d={branch.path}
              className={`branch-path branch-${branch.type}`}
            />
          ))}
        </g>
        {isBlooming && bloomStartPoint && (
            <>
                <path id="seedPath" d={`M ${bloomStartPoint.x} ${bloomStartPoint.y} C ${bloomStartPoint.x} ${bloomStartPoint.y-10}, 50 40, 50 25`} className="hidden" />
                <circle r="0.8" className="bloom-seed">
                    <animateMotion dur="0.8s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.5 0 0.8 0.5">
                        <mpath href="#seedPath" />
                    </animateMotion>
                </circle>

                <g className="bloom-bundle" transform="translate(50, 25)">
                    {Array.from({ length: 8 }).map((_, i) => {
                        const rotation = i * 45;
                        return (
                            <path
                                key={i}
                                className="petal"
                                style={{ animationDelay: `${0.8 + i * 0.05}s` }} // Staggered start after seed travel
                                transform={`rotate(${rotation})`}
                                d="M 0 0 C 2 -5, 8 -8, 0 -15 C -8 -8, -2 -5, 0 0 Z"
                            />
                        );
                    })}
                     <circle r="2" fill="white" style={{opacity: 0, animation: 'unfurl 1.5s 0.8s forwards'}} />
                </g>
             </>
        )}
      </svg>
    </>
  );
};

export default TreeVisualization;