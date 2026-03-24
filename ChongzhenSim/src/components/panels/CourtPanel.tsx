import React from 'react';

export function CourtPanel() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 标题栏 */}
      <div className="panel-decorated bg-palace-bg-light border-b border-palace-border p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <span className="palace-title text-xl panel-title-decorated">
            皇极殿
          </span>
          <span className="text-palace-text-muted text-sm ml-4">
            大朝会与剧本事件
          </span>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="flex-1 overflow-y-auto p-6 palace-scrollbar">
        <div className="palace-card p-6 text-center">
          <div className="palace-title text-2xl mb-4">皇极殿</div>
          <div className="text-palace-text-muted mb-6">
            崇祯皇帝开大朝会的地方
          </div>
          <div className="text-palace-text-muted">
            剧本事件将在这里显示<br />
            大臣奏对与玩家决策<br />
            最终结束回合
          </div>
        </div>
      </div>
    </div>
  );
}
