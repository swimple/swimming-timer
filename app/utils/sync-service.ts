export function saveRaceState(state: any) {
  localStorage.setItem("race-state", JSON.stringify(state));
  window.dispatchEvent(new Event("storage"));
}

export function loadRaceState() {
  const saved = localStorage.getItem("race-state");
  return saved ? JSON.parse(saved) : null;
}
