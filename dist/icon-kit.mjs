const shapes = {
  bear: '<circle cx="12" cy="13" r="6"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><path d="M10 14h4M12 14v2"/>',
  bunny: '<path d="M8 10C5 4 7 2 9 3l2 6m5 1c3-6 1-8-1-7l-2 6"/><circle cx="12" cy="14" r="6"/><path d="M10 15h4M12 15v2"/>',
  fox: '<path d="m5 8 2-5 3 3h4l3-3 2 5v7a7 7 0 0 1-14 0Z"/><path d="m9 15 3 2 3-2M8 11h.01M16 11h.01"/>',
  cat: '<path d="m5 9 1-6 4 3h4l4-3 1 6v6a7 7 0 0 1-14 0Z"/><path d="M9 14h6m-3 0v2M8 11h.01M16 11h.01"/>',
  panda: '<circle cx="12" cy="13" r="7"/><ellipse cx="8.5" cy="10.5" rx="2" ry="2.6"/><ellipse cx="15.5" cy="10.5" rx="2" ry="2.6"/><path d="M10 16h4M12 16v1"/>',
  sprout: '<path d="M12 21V11m0 4c-5 0-7-3-7-7 4 0 7 2 7 7Zm0-4c0-4 3-7 7-7 0 4-2 7-7 7Z"/>',
  tree: '<path d="M12 21v-7m0 0-5 2 3-5-4-1 5-7 5 7-4 1 3 5-5-2"/>',
  home: '<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-6h6v6"/>',
  spark: '<path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8Z"/>',
  cloud: '<path d="M7 18a5 5 0 1 1 .7-9.95A6 6 0 0 1 19 10.5 3.75 3.75 0 1 1 19 18Z"/>',
  moon: '<path d="M20 15.6A8.5 8.5 0 0 1 8.4 4 8.5 8.5 0 1 0 20 15.6Z"/>',
  park: '<path d="M12 21v-7m0 0-5 2 3-5-4-1 5-7 5 7-4 1 3 5-5-2M4 21h16"/>',
  play: '<path d="m9 5 10 7-10 7Z"/>',
  sound: '<path d="M4 10v4h4l5 4V6L8 10Zm12-1c1.5 1.5 1.5 4.5 0 6m3-9c3 3 3 9 0 12"/>',
  chart: '<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 5V2m-3 0h6m-3 11 3 2"/>',
  shield: '<path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M16 5a3 3 0 0 1 0 6m2 3c2 1 3 3 3 6"/>',
};

export function icon(name, label = "", className = "") {
  const graphic = shapes[name] || shapes.spark;
  const accessible = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${accessible}>${graphic}</svg>`;
}
