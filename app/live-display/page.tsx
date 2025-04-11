"use client"

import { useEffect, useState } from "react";
import { loadRaceState } from "../../utils/sync-service";

export default function LiveDisplay() {
  const [raceState, setRaceState] = useState<any>(loadRaceState());

  useEffect(() => {
    const update = () => setRaceState(loadRaceState());
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  return (
    <div className="w-full p-4 text-sm sm:text-base overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Live Race Display</h2>
      <pre>{JSON.stringify(raceState, null, 2)}</pre>
    </div>
  );
}
