// -----------------------------------------------------------------------------
// XLSX export column mapping
// -----------------------------------------------------------------------------
// Columns appear in the export in EXACTLY this order. `key` is the source Ninox
// field; `type` drives value coercion + number formatting:
//   text   -> raw text
//   number -> plain number (0/blank => blank)
//   money  -> rent, displayed as £ whole pounds (0/blank => blank)
//   psf    -> £ per sq ft, 2 dp (0/blank => blank)
//   size   -> sq ft, whole number (0/blank => blank)
//   percent-> occupancy fraction shown as a % (0/blank => blank)
//   yesno  -> boolean / 1 / 0 => "Yes" / "No"
// -----------------------------------------------------------------------------

export const EXPORT_COLUMNS = [
  { header: 'Scheme', key: 'Scheme', type: 'text' },
  { header: 'Town', key: 'Town', type: 'text' },
  { header: 'Regional Filter', key: 'Regional_Filter', type: 'text' },
  { header: 'Sub location Filter', key: 'Sub_location_Filter', type: 'text' },
  { header: 'London Zone', key: 'London_Zone', type: 'text' },
  { header: 'Operator', key: 'Operator', type: 'text' },
  { header: 'Amenities', key: 'Amenities', type: 'text' },
  { header: 'Amenity Grade', key: 'Amenity_Grade', type: 'text' },
  { header: 'Units', key: 'Units', type: 'number' },
  { header: 'Launched', key: 'Launched', type: 'text' },
  { header: 'Height', key: 'Height', type: 'number' },
  { header: 'Stabilised', key: 'Stabilised', type: 'yesno' },
  { header: 'Occupancy', key: 'Occupancy', type: 'percent' },
  { header: 'Average Studio Rent', key: 'Studio_Rent', type: 'money' },
  { header: 'Average Studio Rent (sq ft)', key: 'Studio_psf', type: 'psf' },
  { header: 'Average Bed1 Rent', key: 'Bed1_Rent', type: 'money' },
  { header: 'Average Bed1 Rent (sq ft)', key: 'Bed1_psf', type: 'psf' },
  { header: 'Average Bed 2 Rent', key: 'Bed2_Rent', type: 'money' },
  { header: 'Average Bed2 Rent (sq ft)', key: 'Bed2_psf', type: 'psf' },
  { header: 'Average Bed 3 Rent', key: 'Bed3_Rent', type: 'money' },
  { header: 'Average Bed3 Rent (sq ft)', key: 'Bed3_psf', type: 'psf' },
  { header: 'Studio_Size', key: 'Studio_Size', type: 'size' },
  { header: 'Bed1 Size', key: 'Bed1_Size', type: 'size' },
  { header: 'Bed 2 Size', key: 'Bed2_Size', type: 'size' },
  { header: 'Bed 3 Size', key: 'Bed3_Size', type: 'size' },
  { header: 'Furnished', key: 'Furnished', type: 'yesno' },
  { header: 'Source', key: 'Source', type: 'text' },
  { header: 'Source Verified', key: 'Source_Verified', type: 'yesno' },
  { header: 'Comparables From', key: 'Comparables_From', type: 'text' },
  { header: 'Deals', key: 'Deals', type: 'text' },
  { header: 'Date Filter', key: 'Date_Filter', type: 'text' },
  { header: 'Comments', key: 'Comments', type: 'text' },
]

// Excel number formats applied per column type.
export const NUMBER_FORMAT = {
  money: '£#,##0',
  psf: '0.00',
  size: '0',
  percent: '0.0%',
}

export const EXPORT_FILENAME = 'rental_comps_export.xlsx'
