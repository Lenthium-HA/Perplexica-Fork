'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Clock, Brain, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Fragment } from 'react';

interface MessageInfoProps {
  searchTime?: number;
  processingTime?: number;
  reasoning?: string;
  sourcesCount?: number;
}

const MessageInfo = ({
  searchTime,
  processingTime,
  reasoning,
  sourcesCount = 0
}: MessageInfoProps) => {
  const [isTimingOpen, setIsTimingOpen] = useState(false);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      return `${(ms / 60000).toFixed(1)}min`;
    }
  };

  const totalTime = (searchTime || 0) + (processingTime || 0);

  return (
    <div className="flex flex-col space-y-2">
      {/* Timing Information */}
      <div className="flex flex-col space-y-1">
        <button
          onClick={() => setIsTimingOpen(!isTimingOpen)}
          className="flex items-center space-x-2 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
        >
          <Clock size={16} />
          <span>Processing Time</span>
          {totalTime > 0 && (
            <span className="text-xs font-mono bg-light-secondary dark:bg-dark-secondary px-2 py-1 rounded">
              {formatTime(totalTime)}
            </span>
          )}
          {isTimingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {isTimingOpen && (
          <div className="ml-6 text-xs text-black/60 dark:text-white/60 space-y-1">
            {searchTime !== undefined && searchTime > 0 && (
              <div className="flex justify-between">
                <div className="flex items-center space-x-1">
                  <Search size={12} />
                  <span>Search Time:</span>
                </div>
                <span className="font-mono">{formatTime(searchTime)}</span>
              </div>
            )}
            {processingTime !== undefined && processingTime > 0 && (
              <div className="flex justify-between">
                <div className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>Processing Time:</span>
                </div>
                <span className="font-mono">{formatTime(processingTime)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-light-secondary dark:border-dark-secondary pt-1">
              <span className="font-medium">Total:</span>
              <span className="font-mono font-medium">{formatTime(totalTime)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sources Found:</span>
              <span className="font-mono">{sourcesCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Reasoning Disclosure */}
      {reasoning && (
        <div className="flex flex-col space-y-1">
          <button
            onClick={() => setIsReasoningOpen(!isReasoningOpen)}
            className="flex items-center space-x-2 text-sm text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors"
          >
            <Brain size={16} />
            <span>Reasoning & Sources</span>
            {isReasoningOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {isReasoningOpen && (
            <div className="ml-6">
              <Transition appear show={isReasoningOpen} as={Fragment}>
                <div className="text-xs text-black/60 dark:text-white/60 space-y-2 p-3 bg-light-secondary dark:bg-dark-secondary rounded-lg">
                  <div>
                    <div className="font-medium mb-1 text-black/80 dark:text-white/80">
                      Decision Reasoning:
                    </div>
                    <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                      {reasoning}
                    </div>
                  </div>
                  
                  {sourcesCount > 0 && (
                    <div>
                      <div className="font-medium mb-1 text-black/80 dark:text-white/80">
                        Sources Used:
                      </div>
                      <div className="text-xs">
                        {sourcesCount} source{sourcesCount !== 1 ? 's' : ''} were used to generate this response.
                      </div>
                    </div>
                  )}
                </div>
              </Transition>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageInfo;