import { useState, useCallback } from 'react';
import { PimsleurState, InterviewQuestion, InterviewMode } from '../types';

interface UsePimsleurCycleProps {
  mode?: InterviewMode;
  onStateChange?: (state: PimsleurState) => void;
  pauseDuration?: number;
}

export function usePimsleurCycle({
  mode = 'practice',
  onStateChange,
  pauseDuration = 3000
}: UsePimsleurCycleProps = {}) {
  const [currentState, setCurrentState] = useState<PimsleurState>('IDLE');
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);

  const updateState = useCallback((newState: PimsleurState) => {
    setCurrentState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  const startCycle = useCallback((question: InterviewQuestion) => {
    setCurrentQuestion(question);
    updateState('ASK');
  }, [updateState]);

  const moveToNextState = useCallback(() => {
    if (mode === 'train') {
      // Train mode: ASK → PAUSE1 → MODEL_ANSWER → PAUSE_AFTER_MODEL → REPEAT_ANSWER → PAUSE_AFTER_REPEAT → LISTEN → EVALUATE → FEEDBACK → NEXT
      switch (currentState) {
        case 'ASK':
          updateState('PAUSE1');
          break;
        case 'PAUSE1':
          updateState('MODEL_ANSWER');
          break;
        case 'MODEL_ANSWER':
          updateState('PAUSE_AFTER_MODEL');
          break;
        case 'PAUSE_AFTER_MODEL':
          updateState('REPEAT_ANSWER');
          break;
        case 'REPEAT_ANSWER':
          updateState('PAUSE_AFTER_REPEAT');
          break;
        case 'PAUSE_AFTER_REPEAT':
          updateState('LISTEN');
          break;
        case 'LISTEN':
          updateState('EVALUATE');
          break;
        case 'EVALUATE':
          updateState('FEEDBACK');
          break;
        case 'FEEDBACK':
          updateState('NEXT');
          break;
        case 'NEXT':
          updateState('IDLE');
          break;
        default:
          break;
      }
    } else {
      // Practice mode: ASK → PAUSE1 → REPEAT → PAUSE2 → LISTEN → EVALUATE → FEEDBACK → NEXT
      switch (currentState) {
        case 'ASK':
          updateState('PAUSE1');
          setTimeout(() => updateState('REPEAT'), pauseDuration);
          break;
        case 'REPEAT':
          updateState('PAUSE2');
          break;
        case 'PAUSE2':
          updateState('LISTEN');
          break;
        case 'LISTEN':
          updateState('EVALUATE');
          break;
        case 'EVALUATE':
          updateState('FEEDBACK');
          break;
        case 'FEEDBACK':
          updateState('NEXT');
          break;
        case 'NEXT':
          updateState('IDLE');
          break;
        default:
          break;
      }
    }
  }, [currentState, updateState, pauseDuration, mode]);

  const reset = useCallback(() => {
    setCurrentState('IDLE');
    setCurrentQuestion(null);
  }, []);

  const skipToFeedback = useCallback(() => {
    updateState('FEEDBACK');
  }, [updateState]);

  return {
    currentState,
    currentQuestion,
    startCycle,
    moveToNextState,
    reset,
    skipToFeedback,
    updateState
  };
}
