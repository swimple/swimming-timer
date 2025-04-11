"use client"

import { useState } from "react";
import { saveRaceState } from "../../utils/sync-service";

export default function JudgePage() {
  const [heat, setHeat] = useState(1);

  const updateHeat = () => {
    const next = heat + 1;
    setHeat(next);
    saveRaceState({ currentHeat: next });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Judge Control Panel</h2>
      <p className="my-2">Current Heat: {heat}</p>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={updateHeat}>
        Next Heat
      </button>
    </div>
  );
}
