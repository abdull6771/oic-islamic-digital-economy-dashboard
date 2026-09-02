// Entry-point shim. The dashboard itself lives in `src/` — see `src/App.jsx`.
export { default } from "./src/App.jsx";

/**
 * Approximate country centroids for the Geographic Analysis scatter map.
 *
 * This table would sit beside the view that uses it, but `npm run validate:data`
 * reads it textually out of *this* file — it matches `const GEO_COORDS = {` and
 * a closing brace indented by two spaces — and cross-checks the keys against the
 * workbook so a country can never be added to the index without also getting a
 * position on the map. Two of those 36 checks are skipped entirely if the block
 * is not found here, so the table stays put and keeps the odd closing indent
 * that the matcher expects. Move it only together with `scripts/validate-dataset.mjs`.
 */
export const GEO_COORDS = {
  "United Arab Emirates": [24.0, 54.0],
  "Saudi Arabia": [24.0, 45.0],
  Malaysia: [4.0, 108.0],
  Qatar: [25.3, 51.5],
  Indonesia: [-5.0, 117.0],
  Türkiye: [39.0, 35.0],
  Kazakhstan: [48.0, 68.0],
  Jordan: [31.0, 37.0],
  Tunisia: [34.0, 9.0],
  Morocco: [32.0, -5.0],
  Oman: [21.0, 57.0],
  Uzbekistan: [41.0, 64.0],
  Bahrain: [26.0, 50.5],
  Egypt: [26.0, 30.0],
  Kuwait: [29.5, 47.5],
  Albania: [41.0, 20.0],
  Senegal: [14.0, -14.0],
  "Kyrgyz Republic": [41.5, 75.0],
  Azerbaijan: [40.5, 47.5],
  Algeria: [28.0, 3.0],
  "Iran, Islamic Rep.": [32.0, 53.0],
  Bangladesh: [24.0, 90.0],
  "Brunei Darussalam": [4.5, 114.7],
  Pakistan: [30.0, 70.0],
  Nigeria: [10.0, 8.0],
  Benin: [9.3, 2.3],
  Uganda: [1.0, 32.0],
  "Cote d'Ivoire": [7.5, -5.5],
  Lebanon: [33.9, 35.9],
  Cameroon: [5.0, 12.0],
  Tajikistan: [39.0, 71.0],
  Mali: [17.0, -4.0],
  Maldives: [3.2, 73.2],
  Togo: [8.0, 1.2],
  Suriname: [4.0, -56.0],
  Mozambique: [-18.0, 35.0],
  Mauritania: [20.0, -12.0],
  "Burkina Faso": [12.0, -2.0],
  Gabon: [-1.0, 12.0],
  Guyana: [5.0, -59.0],
  "Sierra Leone": [8.5, -11.8],
  Iraq: [33.0, 44.0],
  Guinea: [11.0, -12.0],
  Gambia: [13.5, -16.6],
  Niger: [17.0, 8.0],
  Yemen: [15.0, 48.0],
  Turkmenistan: [40.0, 59.0],
  Chad: [15.0, 19.0],
  Djibouti: [11.5, 43.0],
  Comoros: [-11.6, 43.3],
  "Guinea-Bissau": [11.8, -15.2],
  Palestine: [31.9, 35.2],
  "Syrian Arab Republic": [35.0, 38.0],
  Libya: [27.0, 17.0],
  Sudan: [15.0, 30.0],
  Afghanistan: [33.0, 65.0],
  Somalia: [6.0, 46.2],
  };
