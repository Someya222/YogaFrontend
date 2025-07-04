import './RoutinePlan.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

function RoutinePlan() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const [goal, setGoal] = useState('');
  const [routine, setRoutine] = useState([]);
  const [saved, setSaved] = useState(false);
  const [streak, setStreak] = useState(0);
  const [streakLoading, setStreakLoading] = useState(true);
  const [poseStatus, setPoseStatus] = useState({}); // { index: true/false }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  const checkAuthAndFetch = async () => {
    try {
      await API.get('/auth/protected');

      setStreakLoading(true);
      const res = await API.get('/yoga/streak');
      setStreak(res.data.streak || 0);
      setStreakLoading(false);

     const routineRes = await API.get(`/yoga/routine?date=${today}`);
const { routine: fetchedRoutine, goal: fetchedGoal } = routineRes.data;

if (fetchedRoutine?.length) {
  setRoutine(fetchedRoutine);
  setGoal(fetchedGoal); // ✅ set goal
  setSaved(true);

  const savedStatus = {};
  fetchedRoutine.forEach((pose, idx) => {
    savedStatus[idx] = pose.done;
  });
  setPoseStatus(savedStatus);
}


    } catch {
      navigate('/login');
    }
  };

  checkAuthAndFetch();
}, [navigate]);



  const handleGenerate = async () => {
  if (!goal.trim()) return alert('Please enter a goal');
  setLoading(true);
  try {
    const datasetRes = await fetch('http://localhost:5000/api/yoga/dataset');
    const dataset = await datasetRes.json();

    const aiRes = await fetch('/api/yoga/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal }),
    });

    const aiData = await aiRes.json();
    let raw = aiData.poses;

    if (typeof raw === 'string') {
      raw = raw.replace(/```json/, '').replace(/```/, '').trim();
      raw = JSON.parse(raw);
    }
    console.log("rawdata",raw)
    // const enriched = raw.slice(0, 6).map((pose) => {
    //   const title = pose.title.trim().toLowerCase();

    //   const match = dataset.find((item) => {
    //     const name = item.name.trim().toLowerCase();
    //     const sanskrit = item.sanskrit_name.trim().toLowerCase();
    //     return (
    //       name.includes(title) ||
    //       title.includes(name) ||
    //       sanskrit.includes(title) ||
    //       title.includes(sanskrit)
    //     );
    //   });

    //   if (!match) {
    //     console.warn('No match found for:', pose.title);
    //   }

    //   return {
    //     title: pose.title,
    //     image:
    //       match?.photo_url ||
    //       'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg',
    //     instructions: pose.instructions || 'No instructions provided',
    //     benefits: pose.benefits || 'No benefits listed',
    //     done: false,
    //   };
    // });


const enriched = raw.slice(0, 6).map((pose) => {
  const englishKey = pose.english_name_search?.trim().toLowerCase();
  const sanskritKey = pose.sanskrit_name_search?.trim().toLowerCase();
  const poseTitle = pose.title?.trim().toLowerCase();

  // Helper to strip parentheses and non-alpha for loose match
  const stripParens = str => str.replace(/\(.*?\)/g, '').trim();
  const stripNonAlpha = str => str.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const stripPose = str => str.replace(/pose/gi, '').trim();

  let matchedItem = dataset.find((item) => {
    const name = item.name.trim().toLowerCase();
    const sanskrit = item.sanskrit_name.trim().toLowerCase();
    return (
      name === englishKey ||
      sanskrit === sanskritKey
    );
  });

  // Try partial match (ignoring parentheses and 'pose')
  if (!matchedItem && poseTitle) {
    // Split poseTitle on parentheses and spaces
    const parenMatch = poseTitle.match(/\((.*?)\)/);
    const parenParts = parenMatch ? parenMatch[1].split(';').map(p => p.trim()) : [];
    const mainPart = poseTitle.split('(')[0].trim();
    let parts = [mainPart, ...parenParts].map(p => p.toLowerCase()).filter(Boolean);
    // Also split parts on spaces for more granular matching
    parts = parts.flatMap(p => [p, ...p.split(' ')]).map(p => stripPose(stripParens(p)).trim()).filter(Boolean);
    matchedItem = dataset.find((item) => {
      const name = stripPose(stripParens(item.name).toLowerCase());
      const sanskrit = stripPose(stripParens(item.sanskrit_name).toLowerCase());
      return parts.some(part => {
        if (!part) return false;
        // Add debug logging
        // console.log(`Comparing part '${part}' with dataset name '${name}' and sanskrit '${sanskrit}'`);
        return (
          name === part ||
          sanskrit === part ||
          name.includes(part) ||
          part.includes(name) ||
          sanskrit.includes(part) ||
          part.includes(sanskrit)
        );
      });
    });
  }

  // Try very loose match (remove all non-alpha and 'pose')
  if (!matchedItem && poseTitle) {
    const poseKey = stripPose(stripNonAlpha(poseTitle));
    matchedItem = dataset.find((item) => {
      const nameAlpha = stripPose(stripNonAlpha(item.name));
      const sanskritAlpha = stripPose(stripNonAlpha(item.sanskrit_name));
      return (
        (nameAlpha && poseKey && nameAlpha === poseKey) ||
        (sanskritAlpha && poseKey && sanskritAlpha === poseKey)
      );
    });
  }

  if (!matchedItem) {
    console.warn("No dataset match for:", pose.title);
    console.log("Searched with:", englishKey, "or", sanskritKey);
  }

  return {
    title: pose.title,
    image:
      matchedItem?.photo_url ||
      "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg",
    instructions: pose.instructions || "No instructions provided",
    benefits: pose.benefits || "No benefits listed",
    done: false,
  };
});


    setRoutine(enriched);

    await API.post('/yoga/routine-status', {
      date: today,
      goal,
      routine: enriched,
    });

    setSaved(true);
  } catch (err) {

    console.error('Error generating routine:', err);
    alert('Something went wrong. Try again.');
  }
  setLoading(false);
};


  const handleMarkDone = async (index) => {
  const today = new Date().toISOString().split('T')[0];

  // ✅ Update routine's pose `done` status
  const updatedRoutine = [...routine];
  updatedRoutine[index].done = !updatedRoutine[index].done;
  setRoutine(updatedRoutine);

  // Update poseStatus as well (optional if you're keeping it)
  const updatedStatus = { ...poseStatus, [index]: updatedRoutine[index].done };
  setPoseStatus(updatedStatus);

  // 🔄 Send full routine to backend
  try {
    await API.post('/yoga/routine-status', {
      date: today,
      goal,
      routine: updatedRoutine
    });

    if (updatedRoutine.every(pose => pose.done)) {
      const res = await API.get('/yoga/streak');
      setStreak(res.data.streak || 0);
    }
  } catch (err) {
    console.error('Error syncing pose status to backend:', err);
  }
};

const handleChangeGoal = () => {
  setRoutine([]);
  setSaved(false);
  setGoal('');
};

return (
  <div className="routine-container">
    <h2>Goal-Based Yoga Routine</h2>

      {!saved && (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. stress relief, PCOD, weight loss"
            style={{ padding: '8px', width: '250px' }}
          />
          <button class="goal-button" onClick={handleGenerate} style={{ marginLeft: '10px' }}>
            Generate Routine
          </button>
          {loading && (
  <div className="spinner"></div>
)}
        </div>
      )}

      {saved && (
        <div style={{ marginBottom: '10px' }}>
          <h3>Routine for <span style={{ color: 'green' }}>{goal || 'Your Goal'}</span></h3>
          <p className="routine-goal-desc">This routine focuses on your goal: <strong>{goal}</strong>.</p>
          <button class="change-goal-button" onClick={handleChangeGoal}>Change Goal</button>
          <div className="streak-graphic-container" style={{ marginTop: '10px' }}>
            <div className="streak-flame">
              {/* SVG flame graphic */}
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 2C19 2 13.5 10.5 13.5 16C13.5 20.1421 16.8579 23.5 21 23.5C25.1421 23.5 28.5 20.1421 28.5 16C28.5 10.5 23 2 23 2C22.5 6 19 2 19 2Z" fill="#ffb300"/>
                <path d="M19 6C16.5 10 16.5 14 19 16C21.5 14 21.5 10 19 6Z" fill="#ff7043"/>
                <ellipse cx="19" cy="28" rx="10" ry="8" fill="#ffe082"/>
              </svg>
            </div>
            <div>
              <div className="streak-text">
                Routine Streak: <span className="streak-count">{streakLoading ? '—' : streak}</span> {streak === 1 ? 'day' : 'days'}!
              </div>
              <div className="streak-progress-bar">
                <div
                  className="streak-progress-fill"
                  style={{ width: `${Math.min((streak % 7) / 7 * 100, 100)}%` }}
                ></div>
              </div>
              <div className="streak-progress-label">
                {streak % 7 === 0 && streak > 0 ? '🔥 New Milestone!' : `${7 - (streak % 7)} days to next badge`}
              </div>
            </div>
          </div>
        </div>
      )}

      {routine.length > 0 && (
        <div className="routine-card-internal">
          {routine.map((pose, index) => (
            <div key={index} className="routine-card">
              <h4>{pose.title}</h4>
              <img src={pose.image} alt={pose.title} />
              <p><strong>How to do:</strong> {pose.instructions}</p>
              <p><strong>Benefits:</strong> {pose.benefits}</p>
              <label>
               <input
  type="checkbox"
  checked={poseStatus[index] || false}
  onChange={() => handleMarkDone(index)}
/>

                Mark as Done
              </label>
            </div>
          ))}
         {routine.length > 0 && routine.every((_, idx) => poseStatus[idx]) && (
  <div style={{
    marginTop: '20px',
    padding: '10px',
    background: '#d4edda',
    color: '#155724',
    borderRadius: '6px',
    fontWeight: 'bold'
  }}>
     Well done! You've completed your yoga routine today!
  </div>
)}

        </div>
      )}
    </div>
  );
}

export default RoutinePlan;
