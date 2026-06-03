// -----------------------------------------------------------------------------
// On-screen table column definitions
// -----------------------------------------------------------------------------
// Each column declares how its value is formatted (`type`) and how it sorts.
// `type` drives display formatting and blank/zero handling in the table.
// -----------------------------------------------------------------------------

export const COLUMNS = [
  { key: 'Scheme', label: 'Scheme', type: 'text', sticky: true },
  { key: 'Date_Filter', label: 'Date', type: 'text' },
  { key: 'Town', label: 'Town', type: 'text' },
  { key: 'Operator', label: 'Operator', type: 'text' },
  { key: 'Amenity_Grade', label: 'Amenity grade', type: 'text' },
  { key: 'Stabilised', label: 'Stabilised', type: 'bool' },
  { key: 'Occupancy', label: 'Occupancy', type: 'percent', align: 'right' },
  { key: 'Units', label: 'Units', type: 'number', align: 'right' },
  { key: 'Studio_Rent', label: 'Studio rent', type: 'rent', align: 'right' },
  { key: 'Bed1_Rent', label: '1 bed rent', type: 'rent', align: 'right' },
  { key: 'Bed2_Rent', label: '2 bed rent', type: 'rent', align: 'right' },
  { key: 'Bed3_Rent', label: '3 bed rent', type: 'rent', align: 'right' },
  { key: 'Studio_Size', label: 'Studio size', type: 'size', align: 'right' },
  { key: 'Bed1_Size', label: '1 bed size', type: 'size', align: 'right' },
  { key: 'Bed2_Size', label: '2 bed size', type: 'size', align: 'right' },
  { key: 'Bed3_Size', label: '3 bed size', type: 'size', align: 'right' },
  { key: 'Studio_psf', label: 'Studio £psf', type: 'psf', align: 'right' },
  { key: 'Bed1_psf', label: '1 bed £psf', type: 'psf', align: 'right' },
  { key: 'Bed2_psf', label: '2 bed £psf', type: 'psf', align: 'right' },
  { key: 'Bed3_psf', label: '3 bed £psf', type: 'psf', align: 'right' },
  { key: 'Source', label: 'Source', type: 'text' },
  { key: 'Source_Verified', label: 'Verified', type: 'bool' },
  { key: 'Comments', label: 'Comments', type: 'text', wide: true },
]
