import React from 'react';
import { CandidateWord } from '../types';

interface CandidateInfoProps {
  candidates: CandidateWord[];
  showDetails?: boolean;
}

const CandidateInfo: React.FC<CandidateInfoProps> = ({ candidates, showDetails = false }) => {
  if (candidates.length === 0) {
    return (
      <div className="candidate-info">
        <div className="candidate-count">No candidates remaining</div>
      </div>
    );
  }

  if (candidates.length === 1) {
    return (
      <div className="candidate-info">
        <div className="candidate-count">1 candidate remaining</div>
        {showDetails && (
          <div className="candidate-details">
            <div className="candidate-word">Answer: {candidates[0].word}</div>
            <div className="candidate-score">Score: {candidates[0].score} (Hits: {candidates[0].hits}, Presents: {candidates[0].presents})</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="candidate-info">
      <div className="candidate-count">{candidates.length} candidates remaining</div>
      {showDetails && (
        <div className="candidate-details">
          <div className="candidate-score">Lowest score: {candidates[0].score}</div>
          <div className="candidate-examples">
            Examples: {candidates.slice(0, 5).map(c => c.word).join(', ')}
            {candidates.length > 5 && `... and ${candidates.length - 5} more`}
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateInfo; 