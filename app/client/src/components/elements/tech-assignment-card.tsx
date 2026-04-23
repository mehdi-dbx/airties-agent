import { memo, useState } from 'react';
import { UserCheck } from 'lucide-react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@chat-template/core';

export interface TechAssignmentCardProps {
  location: string;
  nodeId: string;
  assignedById: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
}

function TechAssignmentCardComponent({ location, nodeId, assignedById, sendMessage }: TechAssignmentCardProps) {
  const [arrived, setArrived] = useState(false);

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 shadow-sm dark:border-sky-800/40 dark:bg-sky-900/20">
      <div className="mb-2 flex items-center gap-2">
        <UserCheck className="size-4 text-sky-600 dark:text-sky-400" />
        <span className="font-semibold text-sky-800 text-sm dark:text-sky-200">Tech Assignment</span>
      </div>
      <div className="mb-2 flex flex-col gap-1 text-xs text-sky-700 dark:text-sky-300">
        <div><span className="font-medium">Location:</span> {location}</div>
        <div><span className="font-medium">Node:</span> {nodeId}</div>
      </div>
      <button
        type="button"
        disabled={arrived}
        onClick={() => {
          setArrived(true);
          sendMessage({
            role: 'user',
            parts: [{ type: 'text', text: `Technician arrived at ${location} for node ${nodeId}` }],
            metadata: { source: 'system', assignedById },
          });
        }}
        className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-600"
      >
        {arrived ? 'Arrived ✓' : 'Mark as Arrived'}
      </button>
    </div>
  );
}

export const TechAssignmentCard = memo(TechAssignmentCardComponent);
