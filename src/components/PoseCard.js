import React, { useState } from 'react';
import './PoseCard.css';

function PoseCard({ title, image, benefits, howTo }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  return (
    <div className={`pose-card ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
      <div className="pose-card-inner">
        <div className="pose-card-front">
          <img src={image} alt={title} />
          <h3>{title}</h3>
        </div>
        <div className="pose-card-back">
          <h4>How to Do:</h4>
          <p>{howTo}</p>
          <h4>Benefits:</h4>
          <p>{benefits}</p>
        </div>
      </div>
    </div>
  );
}

export default PoseCard;

