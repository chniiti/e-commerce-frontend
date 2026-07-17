"use client";

/**
 * Decorative signal field. Parent `.dash-shell` owns --mx/--my for cursor parallax.
 */
export function DashAtmosphere() {
  return (
    <div className="dash-atmosphere" aria-hidden>
      <div className="dash-mesh" />
      <div className="dash-orb dash-orb-a" />
      <div className="dash-orb dash-orb-b" />
      <div className="dash-orb dash-orb-c" />
      <div className="dash-horizon" />
      <div className="dash-lattice" />
      <div className="dash-scan" />
      <div className="dash-grain" />
    </div>
  );
}
