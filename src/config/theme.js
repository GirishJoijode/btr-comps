// -----------------------------------------------------------------------------
// Chart theme tokens (kept in sync with the CSS custom properties in
// src/styles/index.css). Dark blue is the primary; yellow is the accent only.
// -----------------------------------------------------------------------------

export const CHART = {
  primary: '#25273A', // navy (primary bars)
  primaryMid: '#3b3f5c', // lighter navy (secondary bars)
  primaryLight: '#5b6079',
  accent: '#FFDF00', // yellow — accent / highlight only
  grid: '#eceef3',
  axis: '#d6d9e2',
  axisText: '#6b7280',
  categoryText: '#25273A',
}

// Shared tooltip styling for recharts.
export const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #e2e4ec',
  fontSize: 12,
}
