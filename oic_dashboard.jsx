import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  LineChart,
  Line,
  PolarRadiusAxis,
  ReferenceLine,
} from "recharts";

// ─── DATA ───────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    id: "1",
    key: "p1",
    name: "Institutions",
    short: "Institutions",
    weight: 15,
    color: "#F59E0B",
    dim: "Digital Foundation",
  },
  {
    id: "2",
    key: "p2",
    name: "Infrastructure",
    short: "Infrastructure",
    weight: 15,
    color: "#10B981",
    dim: "Digital Foundation",
  },
  {
    id: "3",
    key: "p3",
    name: "Workforce",
    short: "Workforce",
    weight: 10,
    color: "#3B82F6",
    dim: "Digital Works",
  },
  {
    id: "4",
    key: "p4",
    name: "E-Government",
    short: "E-Gov",
    weight: 10,
    color: "#8B5CF6",
    dim: "E-Government",
  },
  {
    id: "5",
    key: "p5",
    name: "Innovation",
    short: "Innovation",
    weight: 5,
    color: "#EF4444",
    dim: "Innovation",
  },
  {
    id: "6",
    key: "p6",
    name: "Future Tech",
    short: "Future Tech",
    weight: 15,
    color: "#06B6D4",
    dim: "Digital Readiness",
  },
  {
    id: "7",
    key: "p7",
    name: "Market Development",
    short: "Market Dev",
    weight: 10,
    color: "#F97316",
    dim: "Digital Readiness",
  },
  {
    id: "8",
    key: "p8",
    name: "Financial Markets",
    short: "Fin. Markets",
    weight: 10,
    color: "#EC4899",
    dim: "Digital Readiness",
  },
  {
    id: "9",
    key: "p9",
    name: "SDG Impact",
    short: "SDG",
    weight: 10,
    color: "#14B8A6",
    dim: "Digital Readiness",
  },
];

const REGIONS = {
  "United Arab Emirates": "GCC",
  "Saudi Arabia": "GCC",
  Qatar: "GCC",
  Bahrain: "GCC",
  Kuwait: "GCC",
  Oman: "GCC",
  Malaysia: "Southeast Asia",
  Indonesia: "Southeast Asia",
  "Brunei Darussalam": "Southeast Asia",
  Maldives: "South Asia",
  Kazakhstan: "Central Asia",
  Uzbekistan: "Central Asia",
  "Kyrgyz Republic": "Central Asia",
  Tajikistan: "Central Asia",
  Turkmenistan: "Central Asia",
  Azerbaijan: "Central Asia",
  Pakistan: "South Asia",
  Bangladesh: "South Asia",
  Jordan: "Middle East",
  Lebanon: "Middle East",
  Iraq: "Middle East",
  "Syrian Arab Republic": "Middle East",
  Yemen: "Middle East",
  Palestine: "Middle East",
  "Iran, Islamic Rep.": "Middle East",
  Türkiye: "Middle East",
  Egypt: "North Africa",
  Morocco: "North Africa",
  Tunisia: "North Africa",
  Algeria: "North Africa",
  Libya: "North Africa",
  Sudan: "North Africa",
  Senegal: "West Africa",
  Nigeria: "West Africa",
  Benin: "West Africa",
  "Cote d'Ivoire": "West Africa",
  Guinea: "West Africa",
  "Guinea-Bissau": "West Africa",
  Mali: "West Africa",
  "Burkina Faso": "West Africa",
  Niger: "West Africa",
  "Gambia, The": "West Africa",
  Togo: "West Africa",
  Mauritania: "West Africa",
  "Sierra Leone": "West Africa",
  Cameroon: "West Africa",
  Gabon: "West Africa",
  Uganda: "East Africa",
  Somalia: "East Africa",
  Djibouti: "East Africa",
  Comoros: "East Africa",
  Mozambique: "East Africa",
  Albania: "Europe",
  Guyana: "Americas",
  Suriname: "Americas",
  Afghanistan: "Central Asia",
  Chad: "West Africa",
};

const COUNTRIES = [
  {
    name: "United Arab Emirates",
    rank: 1,
    adei: 76.8384,
    p1: 77.69,
    p2: 88.51,
    p3: 57.74,
    p4: 95.33,
    p5: 60.56,
    p6: 92.88,
    p7: 65.44,
    p8: 52.54,
    p9: 78.44,
  },
  {
    name: "Malaysia",
    rank: 2,
    adei: 71.9811,
    p1: 78.77,
    p2: 81.99,
    p3: 44.05,
    p4: 81.11,
    p5: 46.02,
    p6: 83.5,
    p7: 74.36,
    p8: 53.35,
    p9: 77.53,
  },
  {
    name: "Saudi Arabia",
    rank: 3,
    adei: 67.7707,
    p1: 66.6,
    p2: 81.56,
    p3: 29.52,
    p4: 96.02,
    p5: 36.77,
    p6: 85.63,
    p7: 54.57,
    p8: 66.75,
    p9: 61.76,
  },
  {
    name: "Qatar",
    rank: 4,
    adei: 66.4413,
    p1: 76.54,
    p2: 75.02,
    p3: 47.61,
    p4: 82.44,
    p5: 36.15,
    p6: 84.7,
    p7: 52.51,
    p8: 31.47,
    p9: 77.93,
  },
  {
    name: "Indonesia",
    rank: 5,
    adei: 61.5662,
    p1: 65.37,
    p2: 66.13,
    p3: 36.86,
    p4: 79.91,
    p5: 39.14,
    p6: 82.23,
    p7: 61.73,
    p8: 25.56,
    p9: 71.44,
  },
  {
    name: "Türkiye",
    rank: 6,
    adei: 60.7098,
    p1: 55.35,
    p2: 75.98,
    p3: 31.38,
    p4: 89.13,
    p5: 42.95,
    p6: 64.36,
    p7: 56.57,
    p8: 36.5,
    p9: 78.5,
  },
  {
    name: "Kazakhstan",
    rank: 7,
    adei: 57.779,
    p1: 57.22,
    p2: 69.8,
    p3: 40.98,
    p4: 90.09,
    p5: 30.89,
    p6: 59.59,
    p7: 37.79,
    p8: 39.66,
    p9: 73.9,
  },
  {
    name: "Jordan",
    rank: 8,
    adei: 52.9428,
    p1: 61.9,
    p2: 61.82,
    p3: 45.48,
    p4: 68.49,
    p5: 27.92,
    p6: 42.03,
    p7: 56.84,
    p8: 24.18,
    p9: 71.85,
  },
  {
    name: "Tunisia",
    rank: 9,
    adei: 52.5912,
    p1: 56.47,
    p2: 51.1,
    p3: 52.24,
    p4: 69.35,
    p5: 22.22,
    p6: 65.32,
    p7: 45.17,
    p8: 16.02,
    p9: 72.7,
  },
  {
    name: "Morocco",
    rank: 10,
    adei: 52.4301,
    p1: 57.6,
    p2: 55.2,
    p3: 42.62,
    p4: 68.41,
    p5: 20.12,
    p6: 63.24,
    p7: 43.05,
    p8: 22.81,
    p9: 73.29,
  },
  {
    name: "Oman",
    rank: 11,
    adei: 52.4029,
    p1: 65.48,
    p2: 67.32,
    p3: 45.47,
    p4: 85.76,
    p5: 35.0,
    p6: 39.99,
    p7: 47.71,
    p8: 5.18,
    p9: 63.24,
  },
  {
    name: "Uzbekistan",
    rank: 12,
    adei: 51.7231,
    p1: 40.13,
    p2: 60.39,
    p3: 34.0,
    p4: 79.99,
    p5: 41.01,
    p6: 55.1,
    p7: 54.86,
    p8: 21.2,
    p9: 73.24,
  },
  {
    name: "Bahrain",
    rank: 13,
    adei: 50.8067,
    p1: 66.91,
    p2: 81.74,
    p3: 38.64,
    p4: 91.96,
    p5: 27.34,
    p6: 23.67,
    p7: 31.57,
    p8: 10.33,
    p9: 63.43,
  },
  {
    name: "Egypt",
    rank: 14,
    adei: 50.6077,
    p1: 46.75,
    p2: 63.69,
    p3: 40.16,
    p4: 66.99,
    p5: 25.2,
    p6: 66.44,
    p7: 49.26,
    p8: 4.07,
    p9: 67.69,
  },
  {
    name: "Kuwait",
    rank: 15,
    adei: 47.465,
    p1: 65.26,
    p2: 76.35,
    p3: 24.85,
    p4: 78.12,
    p5: 16.59,
    p6: 25.35,
    p7: 38.46,
    p8: 12.89,
    p9: 61.59,
  },
  {
    name: "Albania",
    rank: 16,
    adei: 45.3359,
    p1: 65.94,
    p2: 58.91,
    p3: 26.64,
    p4: 80.0,
    p5: 24.53,
    p6: 11.77,
    p7: 39.26,
    p8: 17.64,
    p9: 72.63,
  },
  {
    name: "Senegal",
    rank: 17,
    adei: 43.0662,
    p1: 60.67,
    p2: 44.01,
    p3: 40.45,
    p4: 51.63,
    p5: 29.25,
    p6: 30.43,
    p7: 42.97,
    p8: 20.37,
    p9: 57.95,
  },
  {
    name: "Kyrgyz Republic",
    rank: 18,
    adei: 41.8435,
    p1: 42.16,
    p2: 57.67,
    p3: 52.18,
    p4: 73.16,
    p5: 15.52,
    p6: 18.5,
    p7: 16.07,
    p8: 18.83,
    p9: 72.92,
  },
  {
    name: "Azerbaijan",
    rank: 19,
    adei: 41.7776,
    p1: 44.41,
    p2: 53.57,
    p3: 27.01,
    p4: 76.08,
    p5: 34.67,
    p6: 26.85,
    p7: 33.7,
    p8: 3.3,
    p9: 73.1,
  },
  {
    name: "Algeria",
    rank: 20,
    adei: 40.7712,
    p1: 41.61,
    p2: 55.99,
    p3: 49.37,
    p4: 59.56,
    p5: 22.43,
    p6: 27.92,
    p7: 12.01,
    p8: 16.94,
    p9: 70.34,
  },
  {
    name: "Iran, Islamic Rep.",
    rank: 21,
    adei: 40.3936,
    p1: 18.57,
    p2: 43.03,
    p3: 14.95,
    p4: 65.64,
    p5: 20.53,
    p6: 6.97,
    p7: 44.01,
    p8: 92.89,
    p9: 73.32,
  },
  {
    name: "Bangladesh",
    rank: 22,
    adei: 39.0052,
    p1: 43.48,
    p2: 51.74,
    p3: 20.25,
    p4: 65.7,
    p5: 15.89,
    p6: 25.96,
    p7: 31.82,
    p8: 19.19,
    p9: 63.37,
  },
  {
    name: "Brunei Darussalam",
    rank: 23,
    adei: 37.0481,
    p1: 63.52,
    p2: 52.5,
    p3: 22.41,
    p4: 75.54,
    p5: 20.93,
    p6: 6.97,
    p7: 13.14,
    p8: 3.04,
    p9: 61.39,
  },
  {
    name: "Pakistan",
    rank: 24,
    adei: 35.7656,
    p1: 39.32,
    p2: 35.18,
    p3: 23.7,
    p4: 50.96,
    p5: 27.85,
    p6: 39.9,
    p7: 39.55,
    p8: 8.97,
    p9: 48.97,
  },
  {
    name: "Nigeria",
    rank: 25,
    adei: 35.6966,
    p1: 41.35,
    p2: 28.85,
    p3: 35.18,
    p4: 48.14,
    p5: 13.3,
    p6: 55.51,
    p7: 10.86,
    p8: 21.38,
    p9: 46.19,
  },
  {
    name: "Benin",
    rank: 26,
    adei: 34.5709,
    p1: 58.25,
    p2: 32.05,
    p3: 27.26,
    p4: 45.78,
    p5: 22.19,
    p6: 29.02,
    p7: 11.25,
    p8: 16.43,
    p9: 54.9,
  },
  {
    name: "Uganda",
    rank: 27,
    adei: 32.6323,
    p1: 47.48,
    p2: 18.49,
    p3: 15.35,
    p4: 44.64,
    p5: 18.67,
    p6: 49.85,
    p7: 10.95,
    p8: 24.51,
    p9: 47.8,
  },
  {
    name: "Cote d'Ivoire",
    rank: 28,
    adei: 32.4507,
    p1: 54.26,
    p2: 16.92,
    p3: 26.81,
    p4: 55.87,
    p5: 7.57,
    p6: 30.75,
    p7: 10.39,
    p8: 17.8,
    p9: 56.95,
  },
  {
    name: "Lebanon",
    rank: 29,
    adei: 31.5292,
    p1: 23.34,
    p2: 39.49,
    p3: 24.09,
    p4: 54.49,
    p5: 14.24,
    p6: 6.97,
    p7: 61.95,
    p8: 11.3,
    p9: 51.65,
  },
  {
    name: "Cameroon",
    rank: 30,
    adei: 30.7031,
    p1: 36.74,
    p2: 23.77,
    p3: 27.43,
    p4: 42.94,
    p5: 22.42,
    p6: 28.43,
    p7: 23.49,
    p8: 18.25,
    p9: 50.31,
  },
  {
    name: "Tajikistan",
    rank: 31,
    adei: 27.0826,
    p1: 22.26,
    p2: 20.05,
    p3: 26.75,
    p4: 56.05,
    p5: 17.38,
    p6: 6.97,
    p7: 28.52,
    p8: 14.76,
    p9: 62.12,
  },
  {
    name: "Mali",
    rank: 32,
    adei: 27.0186,
    p1: 32.19,
    p2: 23.91,
    p3: 32.12,
    p4: 30.05,
    p5: 19.81,
    p6: 27.85,
    p7: 12.89,
    p8: 16.03,
    p9: 43.26,
  },
  {
    name: "Maldives",
    rank: 33,
    adei: 26.0918,
    p1: 44.03,
    p2: 8.17,
    p3: 10.6,
    p4: 67.45,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 76.89,
  },
  {
    name: "Togo",
    rank: 34,
    adei: 25.1569,
    p1: 33.65,
    p2: 27.4,
    p3: 19.75,
    p4: 39.2,
    p5: 13.12,
    p6: 6.97,
    p7: 12.91,
    p8: 16.81,
    p9: 54.31,
  },
  {
    name: "Suriname",
    rank: 35,
    adei: 24.6809,
    p1: 43.38,
    p2: 8.17,
    p3: 10.6,
    p4: 63.65,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 67.54,
  },
  {
    name: "Mozambique",
    rank: 36,
    adei: 24.6482,
    p1: 38.49,
    p2: 16.38,
    p3: 34.01,
    p4: 28.48,
    p5: 14.89,
    p6: 13.18,
    p7: 11.8,
    p8: 18.95,
    p9: 43.72,
  },
  {
    name: "Mauritania",
    rank: 37,
    adei: 24.5964,
    p1: 39.02,
    p2: 22.86,
    p3: 13.33,
    p4: 34.91,
    p5: 23.01,
    p6: 18.27,
    p7: 11.99,
    p8: 3.04,
    p9: 50.97,
  },
  {
    name: "Burkina Faso",
    rank: 38,
    adei: 24.005,
    p1: 41.09,
    p2: 13.69,
    p3: 31.69,
    p4: 28.95,
    p5: 14.0,
    p6: 12.52,
    p7: 14.75,
    p8: 13.17,
    p9: 43.57,
  },
  {
    name: "Gabon",
    rank: 39,
    adei: 23.1937,
    p1: 30.6,
    p2: 8.17,
    p3: 10.6,
    p4: 57.41,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 24.29,
    p9: 56.84,
  },
  {
    name: "Guyana",
    rank: 40,
    adei: 22.4837,
    p1: 42.86,
    p2: 8.17,
    p3: 10.6,
    p4: 54.43,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 55.59,
  },
  {
    name: "Sierra Leone",
    rank: 41,
    adei: 21.8553,
    p1: 41.7,
    p2: 10.77,
    p3: 10.6,
    p4: 30.42,
    p5: 7.57,
    p6: 13.84,
    p7: 10.39,
    p8: 9.59,
    p9: 54.3,
  },
  {
    name: "Iraq",
    rank: 42,
    adei: 18.8718,
    p1: 16.3,
    p2: 8.17,
    p3: 10.6,
    p4: 45.72,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 7.1,
    p9: 63.95,
  },
  {
    name: "Guinea",
    rank: 43,
    adei: 18.7678,
    p1: 25.88,
    p2: 8.17,
    p3: 13.08,
    p4: 40.06,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 10.34,
    p9: 48.49,
  },
  {
    name: "Gambia, The",
    rank: 44,
    adei: 18.6569,
    p1: 41.11,
    p2: 8.17,
    p3: 10.6,
    p4: 25.52,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 48.86,
  },
  {
    name: "Niger",
    rank: 45,
    adei: 18.264,
    p1: 30.38,
    p2: 9.66,
    p3: 21.03,
    p4: 21.16,
    p5: 17.12,
    p6: 6.97,
    p7: 21.45,
    p8: 3.04,
    p9: 36.87,
  },
  {
    name: "Yemen",
    rank: 46,
    adei: 17.689,
    p1: 54.12,
    p2: 9.33,
    p3: 11.06,
    p4: 6.69,
    p5: 7.57,
    p6: 7.99,
    p7: 10.39,
    p8: 3.04,
    p9: 34.76,
  },
  {
    name: "Turkmenistan",
    rank: 47,
    adei: 17.5372,
    p1: 16.61,
    p2: 8.17,
    p3: 10.6,
    p4: 47.57,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 52.35,
  },
  {
    name: "Chad",
    rank: 48,
    adei: 16.886,
    p1: 24.43,
    p2: 13.95,
    p3: 19.7,
    p4: 17.85,
    p5: 7.57,
    p6: 14.14,
    p7: 10.39,
    p8: 3.04,
    p9: 35.3,
  },
  {
    name: "Djibouti",
    rank: 49,
    adei: 16.7077,
    p1: 27.66,
    p2: 8.17,
    p3: 10.6,
    p4: 29.1,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 45.95,
  },
  {
    name: "Comoros",
    rank: 50,
    adei: 16.3068,
    p1: 25.66,
    p2: 8.17,
    p3: 10.6,
    p4: 25.86,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 48.18,
  },
  {
    name: "Guinea-Bissau",
    rank: 51,
    adei: 16.1988,
    p1: 26.48,
    p2: 8.17,
    p3: 10.6,
    p4: 30.83,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 40.9,
  },
  {
    name: "Palestine",
    rank: 52,
    adei: 15.1582,
    p1: 49.94,
    p2: 8.17,
    p3: 10.6,
    p4: 6.69,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 19.45,
  },
  {
    name: "Syrian Arab Republic",
    rank: 53,
    adei: 14.4342,
    p1: 5.61,
    p2: 8.17,
    p3: 10.6,
    p4: 38.87,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 46.52,
  },
  {
    name: "Libya",
    rank: 54,
    adei: 14.1504,
    p1: 11.24,
    p2: 8.17,
    p3: 10.6,
    p4: 54.66,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 19.45,
  },
  {
    name: "Sudan",
    rank: 55,
    adei: 12.7881,
    p1: 9.95,
    p2: 8.17,
    p3: 10.6,
    p4: 27.59,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 34.83,
  },
  {
    name: "Afghanistan",
    rank: 56,
    adei: 12.2767,
    p1: 11.19,
    p2: 8.17,
    p3: 10.6,
    p4: 20.83,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.36,
    p9: 34.31,
  },
  {
    name: "Somalia",
    rank: 57,
    adei: 11.124,
    p1: 6.17,
    p2: 8.17,
    p3: 10.6,
    p4: 18.64,
    p5: 7.57,
    p6: 6.97,
    p7: 10.39,
    p8: 3.04,
    p9: 32.82,
  },
];

const TREND_DATA = {
  "United Arab Emirates": [70.22, 71.05, 73.71, 75.24, 76.84],
  Malaysia: [71.08, 71.61, 70.68, 72.92, 71.98],
  "Saudi Arabia": [56.98, 61.0, 68.42, 66.7, 67.77],
  Qatar: [null, null, null, null, 66.44],
  Indonesia: [51.46, 55.93, 58.6, 60.08, 61.57],
  Türkiye: [54.96, 55.86, 48.44, 59.07, 60.71],
  Kazakhstan: [50.07, 53.58, 57.16, 57.07, 57.78],
  Jordan: [47.0, 46.57, 48.94, 49.46, 52.94],
  Tunisia: [48.44, 55.3, 51.41, 51.04, 52.59],
  Morocco: [49.69, 48.12, 51.22, 49.76, 52.43],
  Oman: [48.23, 52.36, 50.9, 51.38, 52.4],
  Uzbekistan: [32.66, 43.13, 41.45, 47.24, 51.72],
  Bahrain: [52.7, 51.69, 48.48, 50.26, 50.81],
  Egypt: [35.31, 43.48, 47.42, 48.96, 50.61],
  Kuwait: [51.15, 47.91, 49.67, 48.8, 47.47],
  Albania: [38.38, 43.68, 44.27, 43.6, 45.34],
  Senegal: [33.66, 39.91, 39.2, 41.17, 43.07],
  "Kyrgyz Republic": [29.94, 26.27, 25.96, 25.63, 41.84],
  Azerbaijan: [39.64, 43.07, 44.37, 43.35, 41.78],
  Algeria: [33.6, 35.21, 39.12, 38.27, 40.77],
  "OIC Average": [30.66, 32.96, 33.03, 33.13, 34.44],
};

const YEARS = [2021, 2022, 2023, 2024, 2025];

const getCluster = (adei) => {
  if (adei >= 60)
    return {
      label: "Advanced Digital Economies",
      color: "#10B981",
      bg: "#D1FAE5",
    };
  if (adei >= 40)
    return {
      label: "Emerging Digital Economies",
      color: "#F59E0B",
      bg: "#FEF3C7",
    };
  return {
    label: "Foundational Digital Economies",
    color: "#EF4444",
    bg: "#FEE2E2",
  };
};

const OIC_AVERAGE =
  COUNTRIES.reduce((s, c) => s + c.adei, 0) / COUNTRIES.length;

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = {
  app: {
    fontFamily: "'Cinzel', 'Georgia', serif",
    background: "#F8FAFC",
    minHeight: "100vh",
    color: "#1E293B",
  },
  header: {
    background:
      "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #EFF6FF 100%)",
    borderBottom: "1px solid #C9A22740",
    padding: "24px 32px",
    position: "relative",
    overflow: "hidden",
  },
  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 2L58 30L30 58L2 30Z' fill='none' stroke='%23C9A22715' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='10' fill='none' stroke='%23C9A22710' stroke-width='1'/%3E%3C/svg%3E")`,
    backgroundSize: "60px 60px",
  },
  tabs: {
    display: "flex",
    overflowX: "auto",
    gap: "2px",
    background: "#F1F5F9",
    borderBottom: "1px solid #CBD5E1",
    padding: "0 16px",
  },
  tab: (active) => ({
    padding: "14px 20px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    border: "none",
    outline: "none",
    fontFamily: "'Cinzel', serif",
    letterSpacing: "0.03em",
    background: active
      ? "linear-gradient(180deg, #EEF2FF 0%, #DBEAFE 100%)"
      : "transparent",
    color: active ? "#C9A227" : "#64748B",
    borderBottom: active ? "2px solid #C9A227" : "2px solid transparent",
    transition: "all 0.2s",
  }),
  content: { padding: "24px 32px", maxWidth: "1400px", margin: "0 auto" },
  card: {
    background: "linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)",
    border: "1px solid #CBD5E1",
    borderRadius: "12px",
    padding: "20px",
  },
  cardTitle: {
    fontSize: "13px",
    fontFamily: "'Cinzel', serif",
    color: "#C9A227",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "16px",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
  },
  scoreBar: (val, color) => ({
    height: "6px",
    borderRadius: "3px",
    background: `linear-gradient(90deg, ${color} ${val}%, #CBD5E1 ${val}%)`,
    marginTop: "4px",
  }),
  badge: (color, bg) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 700,
    color,
    background: bg,
  }),
  rankBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #C9A227, #A07810)",
    color: "#F8FAFC",
    fontSize: "12px",
    fontWeight: 900,
  },
  select: {
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
    color: "#1E293B",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    fontFamily: "'Cinzel', serif",
    cursor: "pointer",
    outline: "none",
  },
  tooltip: {
    background: "#FFFFFF",
    border: "1px solid #C9A22740",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "12px",
    fontFamily: "'Cinzel', serif",
    color: "#1E293B",
  },
};

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={styles.tooltip}>
      <div style={{ color: "#C9A227", fontWeight: 700, marginBottom: "6px" }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#1E293B" }}>
          {p.name}:{" "}
          <span style={{ fontWeight: 700 }}>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── GLOBAL OVERVIEW TAB ────────────────────────────────────────────────────
function GlobalOverview() {
  const sorted = [...COUNTRIES].sort((a, b) => a.rank - b.rank);
  const top10 = sorted.slice(0, 10);
  const bottom10 = sorted.slice(-10).reverse();
  const leaders = COUNTRIES.filter((c) => c.adei >= 60);
  const adopters = COUNTRIES.filter((c) => c.adei >= 40 && c.adei < 60);
  const emerging = COUNTRIES.filter((c) => c.adei < 40);

  const pillarAvgs = PILLARS.map((p) => ({
    name: p.short,
    avg: Math.round(
      COUNTRIES.reduce((s, c) => s + c[p.key], 0) / COUNTRIES.length,
    ),
    color: p.color,
  }));

  const clusterData = [
    {
      name: "Advanced Digital Economies",
      count: leaders.length,
      score: leaders.reduce((s, c) => s + c.adei, 0) / leaders.length,
      color: "#10B981",
    },
    {
      name: "Emerging Digital Economies",
      count: adopters.length,
      score: adopters.reduce((s, c) => s + c.adei, 0) / adopters.length,
      color: "#F59E0B",
    },
    {
      name: "Foundational Digital Economies",
      count: emerging.length,
      score: emerging.reduce((s, c) => s + c.adei, 0) / emerging.length,
      color: "#EF4444",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* KPI Row */}
      <div style={styles.grid4}>
        {[
          {
            label: "OIC Members Assessed",
            value: "57",
            sub: "Countries",
            icon: "🌍",
          },
          {
            label: "OIC Average Score",
            value: OIC_AVERAGE.toFixed(1),
            sub: "out of 100",
            icon: "📊",
          },
          {
            label: "Advanced Digital Economies",
            value: leaders.length,
            sub: "Score ≥ 60",
            icon: "🏆",
          },
          {
            label: "Digital Divide",
            value: (sorted[0].adei - sorted[56].adei).toFixed(1),
            sub: "pts gap (UAE vs Somalia)",
            icon: "⚡",
          },
        ].map((kpi, i) => (
          <div key={i} style={{ ...styles.card, textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>
              {kpi.icon}
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: 900,
                color: "#C9A227",
                fontFamily: "'Cinzel', serif",
              }}
            >
              {kpi.value}
            </div>
            <div
              style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}
            >
              {kpi.sub}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748B",
                marginTop: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.grid2}>
        {/* Leaderboard Leading 10 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🏆 Leading 10 Countries</div>
          {top10.map((c, i) => {
            const cluster = getCluster(c.adei);
            return (
              <div
                key={c.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    ...styles.rankBadge,
                    background:
                      i === 0
                        ? "linear-gradient(135deg,#FFD700,#FFA500)"
                        : i === 1
                          ? "linear-gradient(135deg,#C0C0C0,#A0A0A0)"
                          : i === 2
                            ? "linear-gradient(135deg,#CD7F32,#A05A00)"
                            : "linear-gradient(135deg,#475569,#CBD5E1)",
                    color: i < 3 ? "#F8FAFC" : "#475569",
                    fontSize: "11px",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "3px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1E293B",
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#C9A227",
                      }}
                    >
                      {c.adei.toFixed(1)}
                    </span>
                  </div>
                  <div style={styles.scoreBar(c.adei, cluster.color)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Emerging 10 */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            🌱 Emerging 10 Countries (Development Focus)
          </div>
          {bottom10.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  ...styles.rankBadge,
                  background: "#FEE2E2",
                  color: "#EF4444",
                  fontSize: "10px",
                }}
              >
                {c.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "3px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1E293B",
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#EF4444",
                    }}
                  >
                    {c.adei.toFixed(1)}
                  </span>
                </div>
                <div style={styles.scoreBar(c.adei, "#EF4444")} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cluster Distribution */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>📊 Performance Cluster Distribution</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {clusterData.map((cl) => (
            <div
              key={cl.name}
              style={{
                background: "#F1F5F9",
                borderRadius: "10px",
                padding: "16px",
                border: `1px solid ${cl.color}40`,
                textAlign: "center",
              }}
            >
              <div
                style={{ fontSize: "36px", fontWeight: 900, color: cl.color }}
              >
                {cl.count}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#1E293B",
                  margin: "4px 0",
                }}
              >
                {cl.name}
              </div>
              <div style={{ fontSize: "12px", color: "#64748B" }}>
                Avg: {cl.score.toFixed(1)}
              </div>
              <div
                style={{
                  marginTop: "8px",
                  height: "4px",
                  borderRadius: "2px",
                  background: cl.color,
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pillarAvgs} barSize={30}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" name="OIC Average Score">
              {pillarAvgs.map((p, i) => (
                <Cell key={i} fill={p.color} />
              ))}
            </Bar>
            <ReferenceLine
              y={OIC_AVERAGE}
              stroke="#C9A227"
              strokeDasharray="4 4"
              label={{ value: "OIC Avg", fill: "#C9A227", fontSize: 11 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pillar Correlation Heatmap */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          🔥 Pillar Score Heatmap (All 57 Countries)
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    color: "#C9A227",
                    borderBottom: "1px solid #CBD5E1",
                  }}
                >
                  Country
                </th>
                {PILLARS.map((p) => (
                  <th
                    key={p.id}
                    style={{
                      padding: "6px 4px",
                      color: p.color,
                      borderBottom: "1px solid #CBD5E1",
                      textAlign: "center",
                      fontSize: "10px",
                    }}
                  >
                    {p.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 20).map((c) => (
                <tr key={c.name} style={{ borderBottom: "1px solid #FFFFFF" }}>
                  <td
                    style={{
                      padding: "5px 8px",
                      color: "#1E293B",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.name}
                  </td>
                  {PILLARS.map((p) => {
                    const val = c[p.key];
                    const intensity = val / 100;
                    const r = Math.round(3 + intensity * 6);
                    const g = Math.round(11 + intensity * 89);
                    const b = Math.round(26 + intensity * 150);
                    return (
                      <td
                        key={p.id}
                        style={{ padding: "4px", textAlign: "center" }}
                      >
                        <div
                          style={{
                            background: `rgba(${Math.round(intensity * 16)}, ${Math.round(intensity * 185)}, ${Math.round(intensity * 129)}, ${0.2 + intensity * 0.8})`,
                            borderRadius: "4px",
                            padding: "3px",
                            color: intensity > 0.5 ? "#1E293B" : "#64748B",
                            fontWeight: 600,
                            fontSize: "10px",
                          }}
                        >
                          {val.toFixed(0)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ color: "#64748B", fontSize: "11px", marginTop: "8px" }}>
            Showing leading 20 countries. Use Rankings tab for full table.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COUNTRY PROFILES TAB ───────────────────────────────────────────────────
function CountryProfiles() {
  const [selected, setSelected] = useState("United Arab Emirates");
  const country = COUNTRIES.find((c) => c.name === selected);
  const cluster = getCluster(country.adei);
  const region = REGIONS[country.name] || "Other";

  const pillarData = PILLARS.map((p) => ({
    subject: p.short,
    A: country[p.key],
    OIC_Avg: COUNTRIES.reduce((s, c) => s + c[p.key], 0) / COUNTRIES.length,
    fullMark: 100,
  }));

  const peers = COUNTRIES.filter(
    (c) => REGIONS[c.name] === region && c.name !== selected,
  ).slice(0, 5);

  const strengths = [...PILLARS]
    .sort((a, b) => country[b.key] - country[a.key])
    .slice(0, 3);
  const gaps = [...PILLARS]
    .sort((a, b) => country[a.key] - country[b.key])
    .slice(0, 3);

  const regionPeers = COUNTRIES.filter((c) => REGIONS[c.name] === region).sort(
    (a, b) => a.rank - b.rank,
  );
  const regionRank = regionPeers.findIndex((c) => c.name === selected) + 1;

  const peerCompData = [country, ...peers].map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    Score: parseFloat(c.adei.toFixed(1)),
    fill: c.name === selected ? "#C9A227" : "#CBD5E1",
  }));

  const HEADLINE_REC = {
    "Advanced Digital Economies":
      "Transition from digital follower to global standard-setter. Lead OIC in AI governance, digital export frameworks, and Islamic Fintech international standards.",
    "Emerging Digital Economies":
      "Bridge the gap to Advanced Digital Economies status by targeting private-sector digital adoption, R&D investment, and advanced skills development.",
    "Foundational Digital Economies":
      "Establish core digital infrastructure and implement nationwide digital literacy programs as the immediate national priority.",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header: selector + badge + print */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <select
          style={styles.select}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {[...COUNTRIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>
        <div
          style={{
            ...styles.badge(cluster.color, cluster.bg),
            fontSize: "13px",
            padding: "4px 12px",
          }}
        >
          {cluster.label}
        </div>
        <div style={{ color: "#64748B", fontSize: "13px" }}>
          Region: <span style={{ color: "#475569" }}>{region}</span>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            ...styles.select,
            background: "#EEF2FF",
            color: "#C9A227",
            borderColor: "#C9A22740",
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          🖨 Print / Export
        </button>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "12px",
        }}
      >
        {[
          {
            label: "ODEI Score",
            value: country.adei.toFixed(1),
            color: cluster.color,
          },
          {
            label: "Global Rank",
            value: `#${country.rank} of 57`,
            color: "#C9A227",
          },
          {
            label: "Regional Rank",
            value: `#${regionRank} in ${region}`,
            color: "#10B981",
          },
          {
            label: "Best Pillar",
            value: PILLARS.reduce(
              (b, p) => (country[p.key] > country[b.key] ? p : b),
              PILLARS[0],
            ).short,
            color: "#10B981",
          },
          {
            label: "vs OIC Average",
            value: `${country.adei > OIC_AVERAGE ? "+" : ""}${(country.adei - OIC_AVERAGE).toFixed(1)} pts`,
            color: country.adei >= OIC_AVERAGE ? "#10B981" : "#EF4444",
          },
        ].map((kpi, i) => (
          <div key={i} style={{ ...styles.card, textAlign: "center" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: kpi.color,
                fontFamily: "'Cinzel', serif",
              }}
            >
              {kpi.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748B",
                marginTop: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.grid2}>
        {/* Radar Chart */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>📡 Pillar Radar Profile</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={pillarData}>
              <PolarGrid stroke="#CBD5E1" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#475569", fontSize: 11 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fill: "#64748B", fontSize: 9 }}
              />
              <Radar
                name="OIC Average"
                dataKey="OIC_Avg"
                stroke="#94A3B8"
                fill="#94A3B8"
                fillOpacity={0.1}
                strokeDasharray="4 4"
              />
              <Radar
                name={country.name}
                dataKey="A"
                stroke={cluster.color}
                fill={cluster.color}
                fillOpacity={0.3}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Pillar Scores */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>📊 Pillar Score Breakdown</div>
          {PILLARS.map((p) => (
            <div key={p.id} style={{ marginBottom: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#475569" }}>
                  {p.name}
                </span>
                <span
                  style={{ fontSize: "12px", fontWeight: 700, color: p.color }}
                >
                  {country[p.key].toFixed(1)}
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  borderRadius: "4px",
                  background: "#F1F5F9",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${country[p.key]}%`,
                    background: `linear-gradient(90deg, ${p.color}80, ${p.color})`,
                    borderRadius: "4px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths, Gaps & Recommendation */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "16px",
        }}
      >
        <div style={{ ...styles.card, borderColor: "#10B98140" }}>
          <div style={{ ...styles.cardTitle, color: "#10B981" }}>
            ✅ Key Strengths
          </div>
          {strengths.map((p) => (
            <div
              key={p.key}
              style={{ fontSize: "13px", color: "#475569", padding: "4px 0" }}
            >
              <span style={{ color: p.color }}>●</span> {p.name}{" "}
              <strong style={{ color: "#1E293B" }}>
                {country[p.key].toFixed(0)}
              </strong>
            </div>
          ))}
        </div>
        <div style={{ ...styles.card, borderColor: "#EF444440" }}>
          <div style={{ ...styles.cardTitle, color: "#EF4444" }}>
            ⚠ Areas for Growth
          </div>
          {gaps.map((p) => (
            <div
              key={p.key}
              style={{ fontSize: "13px", color: "#475569", padding: "4px 0" }}
            >
              <span style={{ color: p.color }}>●</span> {p.name}{" "}
              <strong style={{ color: "#EF4444" }}>
                {country[p.key].toFixed(0)}
              </strong>
            </div>
          ))}
        </div>
        <div style={{ ...styles.card, borderColor: "#C9A22740" }}>
          <div style={{ ...styles.cardTitle, color: "#C9A227" }}>
            🎯 Headline Recommendation
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "#475569",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {HEADLINE_REC[cluster.label]}
          </p>
        </div>
      </div>

      {/* Narrative Assessment */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>📝 Narrative Assessment</div>
        <p
          style={{
            color: "#475569",
            fontSize: "14px",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {country.name} scores{" "}
          <strong style={{ color: cluster.color }}>
            {country.adei.toFixed(1)}
          </strong>{" "}
          on the 2025 OIC Digital Economy Index, placing it{" "}
          <strong style={{ color: "#C9A227" }}>#{country.rank}</strong> globally
          and <strong style={{ color: "#10B981" }}>#{regionRank}</strong> within{" "}
          {region}. As a{" "}
          <strong style={{ color: cluster.color }}>{cluster.label}</strong>, the
          country demonstrates notable capability in{" "}
          <strong style={{ color: strengths[0].color }}>
            {strengths[0].name}
          </strong>{" "}
          ({country[strengths[0].key].toFixed(0)}),{" "}
          <strong style={{ color: strengths[1].color }}>
            {strengths[1].name}
          </strong>{" "}
          ({country[strengths[1].key].toFixed(0)}), and{" "}
          <strong style={{ color: strengths[2].color }}>
            {strengths[2].name}
          </strong>{" "}
          ({country[strengths[2].key].toFixed(0)}). However, notable areas for
          development remain in{" "}
          <strong style={{ color: gaps[0].color }}>{gaps[0].name}</strong> (
          {country[gaps[0].key].toFixed(0)}) and{" "}
          <strong style={{ color: gaps[1].color }}>{gaps[1].name}</strong> (
          {country[gaps[1].key].toFixed(0)}), which present the highest
          return-on-investment opportunity for targeted policy intervention.{" "}
          {country.adei >= OIC_AVERAGE
            ? `The country performs ${(country.adei - OIC_AVERAGE).toFixed(1)} points above the OIC average of ${OIC_AVERAGE.toFixed(1)}, positioning it as a potential regional knowledge-transfer hub.`
            : `Closing the ${(OIC_AVERAGE - country.adei).toFixed(1)}-point gap to the OIC average of ${OIC_AVERAGE.toFixed(1)} should serve as a near-term policy milestone.`}
        </p>
      </div>

      {/* Regional Peer Comparison */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          🌍 Regional Peer Comparison — {region}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={peerCompData} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Score">
              {peerCompData.map((d, i) => (
                <Cell key={i} fill={i === 0 ? "#C9A227" : "#CBD5E1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── COMPARE COUNTRIES TAB ──────────────────────────────────────────────────
function CompareCountries() {
  const [selected, setSelected] = useState([
    "United Arab Emirates",
    "Malaysia",
    "Saudi Arabia",
    "Indonesia",
  ]);

  const toggleCountry = (name) => {
    setSelected((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length < 6
          ? [...prev, name]
          : prev,
    );
  };

  const countries = COUNTRIES.filter((c) => selected.includes(c.name));

  const barData = PILLARS.map((p) => {
    const row = { name: p.short };
    countries.forEach((c) => {
      row[c.name] = parseFloat(c[p.key].toFixed(1));
    });
    return row;
  });

  const radarData = PILLARS.map((p) => {
    const row = { subject: p.short };
    countries.forEach((c) => {
      row[c.name] = parseFloat(c[p.key].toFixed(1));
    });
    return row;
  });

  const COMPARE_COLORS = [
    "#C9A227",
    "#10B981",
    "#3B82F6",
    "#EF4444",
    "#8B5CF6",
    "#F97316",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Select Countries (up to 6)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[...COUNTRIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <button
                key={c.name}
                onClick={() => toggleCountry(c.name)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "1px solid",
                  cursor: "pointer",
                  fontSize: "12px",
                  background: selected.includes(c.name)
                    ? "#EEF2FF"
                    : "transparent",
                  borderColor: selected.includes(c.name)
                    ? "#C9A227"
                    : "#CBD5E1",
                  color: selected.includes(c.name) ? "#C9A227" : "#64748B",
                  fontFamily: "'Cinzel', serif",
                }}
              >
                {c.name}
              </button>
            ))}
        </div>
      </div>

      {countries.length > 0 && (
        <>
          {/* Overall Score Comparison */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>🏅 Overall ODEI Score Comparison</div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {countries
                .sort((a, b) => b.adei - a.adei)
                .map((c, i) => (
                  <div
                    key={c.name}
                    style={{
                      flex: "1",
                      minWidth: "120px",
                      ...styles.card,
                      textAlign: "center",
                      border: `1px solid ${COMPARE_COLORS[i]}40`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: 900,
                        color: COMPARE_COLORS[selected.indexOf(c.name)],
                      }}
                    >
                      {c.adei.toFixed(1)}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#475569",
                        marginTop: "4px",
                      }}
                    >
                      {c.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748B" }}>
                      Rank #{c.rank}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div style={styles.grid2}>
            {/* Bar Chart */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>📊 Pillar Bar Comparison</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} layout="vertical" barSize={8}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#CBD5E1"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: "#475569", fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#475569", fontSize: 10 }}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{
                      fontSize: "11px",
                      fontFamily: "'Cinzel', serif",
                    }}
                  />
                  {countries.map((c, i) => (
                    <Bar
                      key={c.name}
                      dataKey={c.name}
                      fill={COMPARE_COLORS[selected.indexOf(c.name)]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Overlay */}
            <div style={styles.card}>
              <div style={styles.cardTitle}>📡 Radar Overlay</div>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#CBD5E1" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#475569", fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={{ fill: "#64748B", fontSize: 9 }}
                  />
                  {countries.map((c, i) => (
                    <Radar
                      key={c.name}
                      name={c.name}
                      dataKey={c.name}
                      stroke={COMPARE_COLORS[selected.indexOf(c.name)]}
                      fill={COMPARE_COLORS[selected.indexOf(c.name)]}
                      fillOpacity={0.15}
                    />
                  ))}
                  <Legend
                    wrapperStyle={{
                      fontSize: "11px",
                      fontFamily: "'Cinzel', serif",
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── PILLAR ANALYSIS TAB ─────────────────────────────────────────────────────
function PillarAnalysis() {
  const [pillarIdx, setPillarIdx] = useState(0);
  const pillar = PILLARS[pillarIdx];
  const sorted = [...COUNTRIES].sort((a, b) => b[pillar.key] - a[pillar.key]);
  const avg =
    COUNTRIES.reduce((s, c) => s + c[pillar.key], 0) / COUNTRIES.length;

  const INSIGHTS = {
    p1: "Institutions form the governance bedrock of digital transformation. GCC states lead, with the UAE, Malaysia, and Qatar demonstrating strong political stability and regulatory quality.",
    p2: "Infrastructure underpins all digital activity. The UAE and Malaysia have near-perfect scores driven by fiber and 5G investments. Many African states score below 20, indicating opportunities for foundational infrastructure investment.",
    p3: "Workforce capability remains a major area of focus. Senegal and Jordan lead in human capital, while conflict-affected states show substantial room for development.",
    p4: "E-Government is the OIC's standout strength. State-led digitization has resulted in high scores across diverse economies, with Saudi Arabia and Kazakhstan leading.",
    p5: "Innovation is the OIC's key area for growth. Even leading countries score below 65, reflecting dependence on state R&D over private-sector investment.",
    p6: "Technological Readiness (Future Tech) varies widely. GCC states score high due to AI and advanced tech adoption strategies.",
    p7: "Market Development shows the strongest performers in Southeast Asia. Malaysia leads due to its vibrant digital economy and startup ecosystem.",
    p8: "Financial Market Development is prominently led by Iran's unique position. Islamic Fintech is an emerging strategic advantage for GCC and Malaysia.",
    p9: "SDG Impact scores reflect access and inclusion progress. Countries with strong public health systems and connectivity score highest.",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Pillar Selector */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Select Pillar to Analyze</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {PILLARS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setPillarIdx(i)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: `1px solid ${i === pillarIdx ? p.color : "#CBD5E1"}`,
                cursor: "pointer",
                fontSize: "12px",
                background: i === pillarIdx ? `${p.color}20` : "transparent",
                color: i === pillarIdx ? p.color : "#64748B",
                fontFamily: "'Cinzel', serif",
                fontWeight: i === pillarIdx ? 700 : 400,
              }}
            >
              {p.name} ({p.weight}%)
            </button>
          ))}
        </div>
      </div>

      {/* Pillar Stats */}
      <div style={styles.grid4}>
        {[
          { label: "Pillar Name", value: pillar.name, color: pillar.color },
          { label: "Weight", value: `${pillar.weight}%`, color: "#C9A227" },
          { label: "OIC Average", value: avg.toFixed(1), color: "#10B981" },
          { label: "Dimension", value: pillar.dim, color: "#8B5CF6" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              ...styles.card,
              textAlign: "center",
              borderColor: `${pillar.color}40`,
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: 900, color: s.color }}>
              {s.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748B",
                marginTop: "4px",
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Key Insight */}
      <div
        style={{
          ...styles.card,
          borderColor: `${pillar.color}40`,
          background: `linear-gradient(135deg, #FFFFFF 0%, ${pillar.color}08 100%)`,
        }}
      >
        <div style={{ ...styles.cardTitle, color: pillar.color }}>
          💡 Key Insight
        </div>
        <p
          style={{
            color: "#475569",
            fontSize: "14px",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {INSIGHTS[pillar.key]}
        </p>
      </div>

      {/* Full Rankings Bar Chart */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          📊 All Countries — {pillar.name} Rankings
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={sorted.map((c) => ({
              name: c.name,
              score: parseFloat(c[pillar.key].toFixed(1)),
            }))}
            barSize={12}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis
              dataKey="name"
              tickFormatter={(name) =>
                name.length > 15 ? name.slice(0, 14) + "…" : name
              }
              tick={{ fill: "#475569", fontSize: 9 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="score"
              name={pillar.name}
              fill={pillar.color}
              fillOpacity={0.85}
            />
            <ReferenceLine
              y={avg}
              stroke="#C9A227"
              strokeDasharray="4 4"
              label={{
                value: `Avg: ${avg.toFixed(1)}`,
                fill: "#C9A227",
                fontSize: 11,
                position: "insideTopRight",
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── GEOGRAPHIC ANALYSIS TAB ─────────────────────────────────────────────────
function GeographicAnalysis() {
  const regionGroups = {};
  COUNTRIES.forEach((c) => {
    const r = REGIONS[c.name] || "Other";
    if (!regionGroups[r]) regionGroups[r] = [];
    regionGroups[r].push(c);
  });

  const regionStats = Object.entries(regionGroups)
    .map(([region, countries]) => ({
      region,
      count: countries.length,
      avg: countries.reduce((s, c) => s + c.adei, 0) / countries.length,
      max: Math.max(...countries.map((c) => c.adei)),
      min: Math.min(...countries.map((c) => c.adei)),
      countries,
    }))
    .sort((a, b) => b.avg - a.avg);

  const REGION_COLORS = {
    GCC: "#F59E0B",
    "Southeast Asia": "#10B981",
    "Central Asia": "#3B82F6",
    "South Asia": "#8B5CF6",
    "Middle East": "#EF4444",
    "North Africa": "#06B6D4",
    "West Africa": "#F97316",
    "East Africa": "#EC4899",
    Europe: "#14B8A6",
    Americas: "#A78BFA",
  };

  const clusterByRegion = regionStats.map((r) => ({
    name: r.region,
    Leaders: r.countries.filter((c) => c.adei >= 60).length,
    Adopters: r.countries.filter((c) => c.adei >= 40 && c.adei < 60).length,
    Emerging: r.countries.filter((c) => c.adei < 40).length,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Region Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "12px",
        }}
      >
        {regionStats.slice(0, 5).map((r) => (
          <div
            key={r.region}
            style={{
              ...styles.card,
              borderColor: `${REGION_COLORS[r.region] || "#CBD5E1"}40`,
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: REGION_COLORS[r.region] || "#C9A227",
                fontWeight: 700,
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              {r.region}
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: REGION_COLORS[r.region] || "#1E293B",
              }}
            >
              {r.avg.toFixed(1)}
            </div>
            <div style={{ fontSize: "11px", color: "#64748B" }}>
              {r.count} countries
            </div>
            <div
              style={{ fontSize: "10px", color: "#475569", marginTop: "4px" }}
            >
              Range: {r.min.toFixed(0)}–{r.max.toFixed(0)}
            </div>
          </div>
        ))}
      </div>

      {/* Regional Average Chart */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>📊 Regional Average OIC DEI Scores</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={regionStats.map((r) => ({
              name: r.region,
              avg: parseFloat(r.avg.toFixed(1)),
            }))}
            barSize={35}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#475569", fontSize: 10 }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis domain={[0, 80]} tick={{ fill: "#475569", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" name="Regional Average">
              {regionStats.map((r, i) => (
                <Cell key={i} fill={REGION_COLORS[r.region] || "#CBD5E1"} />
              ))}
            </Bar>
            <ReferenceLine
              y={OIC_AVERAGE}
              stroke="#C9A227"
              strokeDasharray="4 4"
              label={{ value: "OIC Average", fill: "#C9A227", fontSize: 11 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cluster Distribution by Region */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>🗺 Cluster Distribution by Region</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={clusterByRegion} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#475569", fontSize: 10 }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fill: "#475569", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="Leaders" fill="#10B981" stackId="a" />
            <Bar dataKey="Adopters" fill="#F59E0B" stackId="a" />
            <Bar dataKey="Emerging" fill="#EF4444" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Country Table by Region */}
      {regionStats.map((r) => (
        <div key={r.region} style={styles.card}>
          <div
            style={{
              ...styles.cardTitle,
              color: REGION_COLORS[r.region] || "#C9A227",
            }}
          >
            {r.region} ({r.count} countries, avg: {r.avg.toFixed(1)})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[...r.countries]
              .sort((a, b) => b.adei - a.adei)
              .map((c) => {
                const cl = getCluster(c.adei);
                return (
                  <div
                    key={c.name}
                    style={{
                      background: "#F1F5F9",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      border: `1px solid ${cl.color}30`,
                      minWidth: "130px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#1E293B",
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 900,
                        color: cl.color,
                      }}
                    >
                      {c.adei.toFixed(1)}
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748B" }}>
                      #{c.rank}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TRENDS TAB ─────────────────────────────────────────────────────────────
function TrendsProgress() {
  const availableCountries = [
    "OIC Average",
    ...[...COUNTRIES].map((c) => c.name).sort(),
  ];
  const [selectedCountries, setSelectedCountries] = useState([
    "United Arab Emirates",
    "Saudi Arabia",
    "Malaysia",
    "Indonesia",
    "Türkiye",
    "OIC Average",
  ]);

  const toggleCountry = (name) => {
    setSelectedCountries((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const selectAll = () => setSelectedCountries(availableCountries);
  const deselectAll = () => setSelectedCountries([]);

  const trendColors = {
    "United Arab Emirates": "#C9A227",
    "Saudi Arabia": "#F59E0B",
    Malaysia: "#10B981",
    Indonesia: "#3B82F6",
    Qatar: "#8B5CF6",
    Türkiye: "#06B6D4",
    Kazakhstan: "#EF4444",
    Jordan: "#F97316",
    "OIC Average": "#1E293B",
  };

  const OTHER_COLORS = ["#EC4899", "#14B8A6", "#EAB308", "#F43F5E", "#8B5CF6"];
  const getColor = (c, i) =>
    trendColors[c] || OTHER_COLORS[i % OTHER_COLORS.length];

  const lineData = YEARS.map((year, yi) => {
    const row = { year };
    selectedCountries.forEach((country) => {
      if (TREND_DATA[country]) {
        row[country] = TREND_DATA[country][yi];
      } else {
        const c = COUNTRIES.find((x) => x.name === country);
        if (c) {
          // Estimate historical data for missing countries
          const startScore = c.adei * 0.85;
          const step = (c.adei - startScore) / 4;
          row[country] = parseFloat((startScore + step * yi).toFixed(2));
        }
      }
    });
    return row;
  });

  // Score distribution
  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${(i + 1) * 10}`,
    count: COUNTRIES.filter((c) => c.adei >= i * 10 && c.adei < (i + 1) * 10)
      .length,
  }));

  // Country ladder (rank sorted)
  const sorted = [...COUNTRIES].sort((a, b) => a.rank - b.rank);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={styles.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div style={{ ...styles.cardTitle, marginBottom: 0 }}>
            Filter Countries
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={selectAll}
              style={{
                background: "#10B981",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              style={{
                background: "#EF4444",
                color: "#FFFFFF",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Deselect All
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {availableCountries.map((c) => (
            <button
              key={c}
              onClick={() => toggleCountry(c)}
              style={{
                background: selectedCountries.includes(c)
                  ? "#C9A227"
                  : "#F1F5F9",
                color: selectedCountries.includes(c) ? "#FFFFFF" : "#475569",
                border: "none",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: selectedCountries.includes(c) ? 600 : 400,
                transition: "all 0.2s ease",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Trend Lines */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>📈 ODEI Score Trends 2021–2025</div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis dataKey="year" tick={{ fill: "#475569", fontSize: 11 }} />
            <YAxis domain={[25, 80]} tick={{ fill: "#475569", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", fontFamily: "'Cinzel', serif" }}
            />
            {selectedCountries.map((country, i) => (
              <Line
                key={country}
                type="monotone"
                dataKey={country}
                stroke={getColor(country, i)}
                strokeWidth={country === "OIC Average" ? 3 : 2}
                dot={{
                  fill: getColor(country, i),
                  r: country === "OIC Average" ? 0 : 3,
                }}
                strokeDasharray={country === "OIC Average" ? "5 5" : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.grid2}>
        {/* Score Distribution */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>📊 Score Distribution (2025)</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bins} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
              <XAxis dataKey="range" tick={{ fill: "#475569", fontSize: 10 }} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                name="Countries"
                fill="#C9A227"
                fillOpacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              background: "#F1F5F9",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
                textAlign: "center",
              }}
            >
              {[
                { label: "Mean", value: OIC_AVERAGE.toFixed(1) },
                { label: "Median", value: sorted[28].adei.toFixed(1) },
                {
                  label: "Std Dev",
                  value: Math.sqrt(
                    COUNTRIES.reduce(
                      (s, c) => s + (c.adei - OIC_AVERAGE) ** 2,
                      0,
                    ) / COUNTRIES.length,
                  ).toFixed(1),
                },
              ].map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 900,
                      color: "#C9A227",
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Country Ladder */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>🪜 Country Ladder (2025 Rankings)</div>
          <div style={{ maxHeight: "280px", overflowY: "auto" }}>
            {sorted.map((c, i) => {
              const cl = getCluster(c.adei);
              return (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "5px 0",
                    borderBottom: "1px solid #F1F5F9",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#475569",
                      width: "20px",
                      textAlign: "right",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: "12px", color: "#1E293B" }}>
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: cl.color,
                    }}
                  >
                    {c.adei.toFixed(1)}
                  </div>
                  <div
                    style={{
                      width: "60px",
                      height: "4px",
                      borderRadius: "2px",
                      background: "#F1F5F9",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${c.adei}%`,
                        background: cl.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "10px" }}>
        <ProgressTracker hideTrajectory={true} />
      </div>
    </div>
  );
}

// ─── RANKINGS EXPLORER TAB ──────────────────────────────────────────────────
function RankingsExplorer() {
  const [sortBy, setSortBy] = useState("rank");
  const [sortDir, setSortDir] = useState("asc");
  const [filter, setFilter] = useState("");

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const filtered = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase()),
  );
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortBy] ?? a.adei;
    const bv = b[sortBy] ?? b.adei;
    return sortDir === "asc"
      ? typeof av === "string"
        ? av.localeCompare(bv)
        : av - bv
      : typeof av === "string"
        ? bv.localeCompare(av)
        : bv - av;
  });

  const exportCSV = () => {
    const headers = ["Rank", "Country", "ODEI", ...PILLARS.map((p) => p.name)];
    const rows = sorted.map((c) => [
      c.rank,
      c.name,
      c.adei.toFixed(2),
      ...PILLARS.map((p) => c[p.key].toFixed(2)),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "OIC_ODEI_Rankings.csv";
    a.click();
  };

  const SortIcon = ({ col }) => (
    <span
      style={{
        color: sortBy === col ? "#C9A227" : "#CBD5E1",
        marginLeft: "4px",
      }}
    >
      {sortBy === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <input
          placeholder="🔍 Search country..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ ...styles.select, flex: 1 }}
        />
        <button
          onClick={exportCSV}
          style={{
            ...styles.select,
            background: "#EEF2FF",
            color: "#C9A227",
            borderColor: "#C9A22740",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          ⬇ Export CSV
        </button>
        <div style={{ fontSize: "12px", color: "#64748B" }}>
          {sorted.length} of 57 countries
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #C9A22740" }}>
                {[
                  ["rank", "#"],
                  ["name", "Country"],
                  ["adei", "ODEI"],
                  ...PILLARS.map((p) => [p.key, p.short]),
                ].map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    style={{
                      padding: "10px 8px",
                      cursor: "pointer",
                      color: sortBy === key ? "#C9A227" : "#64748B",
                      textAlign: key === "name" ? "left" : "center",
                      whiteSpace: "nowrap",
                      fontFamily: "'Cinzel', serif",
                      fontSize: "11px",
                    }}
                  >
                    {label}
                    <SortIcon col={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const cl = getCluster(c.adei);
                return (
                  <tr
                    key={c.name}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      background: i % 2 === 0 ? "transparent" : "#64748B10",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        color: "#475569",
                        fontWeight: 700,
                      }}
                    >
                      {c.rank}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        color: "#1E293B",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          ...styles.badge(cl.color, cl.bg),
                          marginRight: "6px",
                          fontSize: "9px",
                        }}
                      >
                        ●
                      </span>
                      {c.name}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontWeight: 900,
                        color: cl.color,
                      }}
                    >
                      {c.adei.toFixed(1)}
                    </td>
                    {PILLARS.map((p) => {
                      const val = c[p.key];
                      const intensity = val / 100;
                      return (
                        <td
                          key={p.id}
                          style={{ padding: "6px 4px", textAlign: "center" }}
                        >
                          <div
                            style={{
                              background: `rgba(${Math.round(intensity * 200)}, ${Math.round(intensity * 185)}, ${Math.round(30)}, ${0.15 + intensity * 0.5})`,
                              borderRadius: "4px",
                              padding: "2px 4px",
                              color: "#1E293B",
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            {val.toFixed(0)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── POLICY RECOMMENDATIONS TAB ─────────────────────────────────────────────
function PolicyRecommendations() {
  const [selected, setSelected] = useState("United Arab Emirates");
  const country = COUNTRIES.find((c) => c.name === selected);
  const cluster = getCluster(country.adei);

  const generateRecommendations = (c) => {
    const recs = [];
    const p = PILLARS.reduce((acc, pillar) => {
      acc[pillar.key] = c[pillar.key];
      return acc;
    }, {});

    if (p.p5 < 40)
      recs.push({
        pillar: "Innovation",
        priority: "IMMEDIATE",
        action:
          "Establish a national R&D incentive framework to attract private-sector investment. Target: Increase business-financed R&D from <1% to 3% of GDP within 5 years. Create public-private innovation hubs at universities.",
        icon: "🔬",
      });
    if (p.p3 < 40)
      recs.push({
        pillar: "Workforce",
        priority: "HIGH",
        action:
          "Launch a national digital skills accelerator program targeting youth and women. Partner with tech giants for upskilling certificates. Integrate AI literacy into national curriculum.",
        icon: "🎓",
      });
    if (p.p2 < 50)
      recs.push({
        pillar: "Infrastructure",
        priority: "HIGH",
        action:
          "Accelerate fiber broadband and 5G rollout to rural areas. Pursue public-private partnerships for infrastructure financing. Leverage Islamic Social Finance (Zakat/Waqf) for digital inclusion.",
        icon: "📡",
      });
    if (p.p1 < 50)
      recs.push({
        pillar: "Institutions",
        priority: "HIGH",
        action:
          "Strengthen digital governance frameworks and regulatory quality. Establish an independent digital regulator and implement GDPR-aligned data protection laws.",
        icon: "⚖",
      });
    if (p.p4 < 60)
      recs.push({
        pillar: "E-Government",
        priority: "MEDIUM",
        action:
          "Expand national e-ID and digital public service portals. Adopt open data standards and interoperable government systems. Benchmark against UAE PASS and Saudi Arabia's Absher.",
        icon: "🏛",
      });
    if (p.p8 < 30)
      recs.push({
        pillar: "Financial Markets",
        priority: "MEDIUM",
        action:
          "Develop Islamic Fintech regulatory sandbox to attract digital finance innovation. Promote mobile banking and digital wallets for financial inclusion, especially in rural areas.",
        icon: "💰",
      });
    if (p.p6 < 40)
      recs.push({
        pillar: "Future Tech",
        priority: "MEDIUM",
        action:
          "Create a national AI strategy and invest in cloud infrastructure. Attract foreign tech FDI through special economic zones and tax incentives for tech firms.",
        icon: "🤖",
      });
    if (p.p7 < 40)
      recs.push({
        pillar: "Market Development",
        priority: "MEDIUM",
        action:
          "Reduce digital trade barriers and streamline e-commerce regulations. Support SME digital adoption through subsidized digital tools and training programs.",
        icon: "🛒",
      });

    if (!recs.length)
      recs.push({
        pillar: "Leadership",
        priority: "STRATEGIC",
        action:
          "Maintain leadership position by expanding digital exports, establishing regional tech hubs, and leading OIC digital standards. Invest in cutting-edge research in AI, quantum computing, and blockchain.",
        icon: "🚀",
      });

    return recs;
  };

  const recs = generateRecommendations(country);

  const PRIORITY_STYLES = {
    IMMEDIATE: { color: "#EF4444", bg: "#FEE2E2", border: "#EF4444" },
    HIGH: { color: "#F59E0B", bg: "#FEF3C7", border: "#F59E0B" },
    MEDIUM: { color: "#3B82F6", bg: "#DBEAFE", border: "#3B82F6" },
    STRATEGIC: { color: "#10B981", bg: "#D1FAE5", border: "#10B981" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <select
          style={styles.select}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {[...COUNTRIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>
        <div
          style={{
            ...styles.badge(cluster.color, cluster.bg),
            fontSize: "13px",
            padding: "4px 12px",
          }}
        >
          {cluster.label} · Score: {country.adei.toFixed(1)} · Rank #
          {country.rank}
        </div>
      </div>

      <div
        style={{
          ...styles.card,
          borderColor: `${cluster.color}40`,
          background: `linear-gradient(135deg, #FFFFFF, ${cluster.color}08)`,
        }}
      >
        <div style={{ ...styles.cardTitle, color: cluster.color }}>
          🎯 Strategic Context for {country.name}
        </div>
        <p
          style={{
            color: "#475569",
            fontSize: "13px",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          {country.name} is classified as a{" "}
          <strong style={{ color: cluster.color }}>{cluster.label}</strong> with
          an ODEI score of{" "}
          <strong style={{ color: "#C9A227" }}>
            {country.adei.toFixed(1)}
          </strong>{" "}
          (Rank #{country.rank} of 57 OIC states). The following evidence-based
          recommendations are derived from pillar-level gap analysis relative to
          OIC leading nations and global best practices.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {recs.map((rec, i) => {
          const ps = PRIORITY_STYLES[rec.priority];
          return (
            <div
              key={i}
              style={{
                ...styles.card,
                border: `1px solid ${ps.border}40`,
                background: ps.bg,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    minWidth: "36px",
                    textAlign: "center",
                  }}
                >
                  {rec.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        ...styles.badge(ps.color, `${ps.border}20`),
                        fontSize: "10px",
                      }}
                    >
                      {rec.priority}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#1E293B",
                        fontFamily: "'Cinzel', serif",
                      }}
                    >
                      {rec.pillar}
                    </span>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>
                      Current Score:{" "}
                      {country[
                        PILLARS.find(
                          (p) =>
                            p.name === rec.pillar ||
                            p.short === rec.pillar ||
                            p.pillar === rec.pillar,
                        )?.key || "p1"
                      ]?.toFixed(1)}
                    </span>
                  </div>
                  <p
                    style={{
                      color: "#475569",
                      fontSize: "13px",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {rec.action}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* OIC-wide Recommendations */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>🌍 OIC-Wide Strategic Priorities</div>
        {[
          {
            icon: "📶",
            title: "Bridging the Digital Divide",
            desc: "The 65-point gap between UAE (77) and Somalia (11) highlights the importance of intra-OIC knowledge transfer. Establish OIC Digital Solidarity Fund modeled on Islamic Development Bank frameworks.",
          },
          {
            icon: "🕌",
            title: "Islamic Fintech as Strategic Advantage",
            desc: "Capitalize on Islamic finance digitalization. Create harmonized OIC Fintech regulatory framework to position the bloc as a global Islamic digital finance hub.",
          },
          {
            icon: "🧠",
            title: "Human Capital Development",
            desc: "Launch OIC-wide digital skills initiative targeting 10 million youth by 2030. Leverage intra-OIC scholarship programs for STEM and digital economy fields.",
          },
          {
            icon: "🔗",
            title: "Digital Infrastructure Integration",
            desc: "Develop OIC digital corridor connecting broadband networks across member states. Prioritize last-mile connectivity in Sub-Saharan African members.",
          },
        ].map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "12px",
              padding: "12px 0",
              borderBottom: "1px solid #FFFFFF",
            }}
          >
            <span style={{ fontSize: "20px" }}>{r.icon}</span>
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#1E293B",
                  marginBottom: "4px",
                  fontFamily: "'Cinzel', serif",
                }}
              >
                {r.title}
              </div>
              <div
                style={{ fontSize: "12px", color: "#64748B", lineHeight: 1.6 }}
              >
                {r.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DIGITAL DIVIDE TAB ─────────────────────────────────────────────────────
function DigitalDivide() {
  const sorted = [...COUNTRIES].sort((a, b) => b.adei - a.adei);
  const oicAvg = OIC_AVERAGE;
  const above = sorted.filter((c) => c.adei >= oicAvg);
  const below = sorted.filter((c) => c.adei < oicAvg);

  const gapData = sorted.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    gap: parseFloat((c.adei - oicAvg).toFixed(1)),
    score: parseFloat(c.adei.toFixed(1)),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={styles.grid4}>
        {[
          {
            label: "Countries Above OIC Avg",
            value: above.length,
            color: "#10B981",
          },
          {
            label: "Countries Below OIC Avg",
            value: below.length,
            color: "#EF4444",
          },
          {
            label: "OIC Average Score",
            value: oicAvg.toFixed(1),
            color: "#C9A227",
          },
          {
            label: "Max Digital Divide",
            value: `${(sorted[0].adei - sorted[56].adei).toFixed(0)} pts`,
            color: "#EF4444",
          },
        ].map((k, i) => (
          <div key={i} style={{ ...styles.card, textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: 900, color: k.color }}>
              {k.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748B",
                marginTop: "4px",
                textTransform: "uppercase",
              }}
            >
              {k.label}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          📊 Gap from OIC Average (All 57 Countries)
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={gapData} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#475569", fontSize: 9 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis tick={{ fill: "#475569", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={0}
              stroke="#C9A227"
              strokeWidth={2}
              label={{ value: "OIC Average", fill: "#C9A227", fontSize: 11 }}
            />
            <Bar dataKey="gap" name="Gap from OIC Avg">
              {gapData.map((d, i) => (
                <Cell key={i} fill={d.gap >= 0 ? "#10B981" : "#EF4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={{ ...styles.cardTitle, color: "#10B981" }}>
            🌟 Above OIC Average ({above.length})
          </div>
          {above.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderBottom: "1px solid #F1F5F9",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "#1E293B" }}>{c.name}</span>
              <span style={{ color: "#10B981", fontWeight: 700 }}>
                +{(c.adei - oicAvg).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        <div style={styles.card}>
          <div style={{ ...styles.cardTitle, color: "#EF4444" }}>
            ⚠ Below OIC Average ({below.length})
          </div>
          {below.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderBottom: "1px solid #F1F5F9",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "#1E293B" }}>{c.name}</span>
              <span style={{ color: "#EF4444", fontWeight: 700 }}>
                {(c.adei - oicAvg).toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── INNOVATION SPECIAL TAB ─────────────────────────────────────────────────
function IslamicDigitalSpecial() {
  const fintech = [...COUNTRIES].sort((a, b) => b.p8 - a.p8).slice(0, 15);
  const innovators = [...COUNTRIES].sort((a, b) => b.p5 - a.p5).slice(0, 15);

  const QUADRANT_DATA = COUNTRIES.map((c) => ({
    name: c.name,
    x: c.p5,
    y: c.p8,
    z: c.adei,
    color: c.adei >= 60 ? "#10B981" : c.adei >= 40 ? "#F59E0B" : "#EF4444",
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          ...styles.card,
          borderColor: "#C9A22740",
          background: "linear-gradient(135deg, #FFFFFF 0%, #C9A22708 100%)",
        }}
      >
        <div style={styles.cardTitle}>
          🕌 Islamic Digital Economy Special Analysis
        </div>
        <p
          style={{
            color: "#475569",
            fontSize: "14px",
            lineHeight: 1.8,
            margin: 0,
          }}
        >
          A unique strategic opportunity is emerging within the OIC bloc: the
          convergence of{" "}
          <strong style={{ color: "#C9A227" }}>Islamic Finance</strong> and{" "}
          <strong style={{ color: "#10B981" }}>digital technology</strong>.
          Nations such as Malaysia, Saudi Arabia, and the UAE are leveraging
          Islamic Fintech as a globally competitive advantage. Meanwhile,
          Innovation remains a key systemic area for growth for the OIC — the
          region produces far more digital consumers than digital innovators.
        </p>
      </div>

      {/* Innovation vs Financial Markets Scatter */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          💡 Innovation vs. Financial Market Development (Scatter)
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis
              type="number"
              dataKey="x"
              name="Innovation Score"
              domain={[0, 100]}
              tick={{ fill: "#475569", fontSize: 11 }}
              label={{
                value: "Innovation →",
                fill: "#64748B",
                fontSize: 11,
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Financial Market Score"
              domain={[0, 100]}
              tick={{ fill: "#475569", fontSize: 11 }}
              label={{
                value: "Financial Markets →",
                fill: "#64748B",
                fontSize: 11,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <ZAxis type="number" dataKey="z" range={[40, 400]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div style={styles.tooltip}>
                    <div style={{ color: "#C9A227", fontWeight: 700 }}>
                      {d.name}
                    </div>
                    <div>Innovation: {d.x.toFixed(1)}</div>
                    <div>Fin. Markets: {d.y.toFixed(1)}</div>
                    <div>ODEI: {d.z.toFixed(1)}</div>
                  </div>
                );
              }}
            />
            <Scatter data={QUADRANT_DATA}>
              {QUADRANT_DATA.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={0.7} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.grid2}>
        {/* Leading Islamic Fintech */}
        <div style={styles.card}>
          <div style={{ ...styles.cardTitle, color: "#EC4899" }}>
            🏦 Leading 15 — Financial Market Development
          </div>
          {fintech.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  ...styles.rankBadge,
                  background:
                    i < 3
                      ? "linear-gradient(135deg,#EC4899,#9D174D)"
                      : "#FFFFFF",
                  color: "#1E293B",
                  fontSize: "10px",
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "12px", color: "#1E293B" }}>
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#EC4899",
                    }}
                  >
                    {c.p8.toFixed(1)}
                  </span>
                </div>
                <div style={styles.scoreBar(c.p8, "#EC4899")} />
              </div>
            </div>
          ))}
        </div>

        {/* Leading Innovators */}
        <div style={styles.card}>
          <div style={{ ...styles.cardTitle, color: "#EF4444" }}>
            🔬 Leading 15 — Innovation Leaders
          </div>
          {innovators.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  ...styles.rankBadge,
                  background:
                    i < 3
                      ? "linear-gradient(135deg,#EF4444,#7F1D1D)"
                      : "#FFFFFF",
                  color: "#1E293B",
                  fontSize: "10px",
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "12px", color: "#1E293B" }}>
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#EF4444",
                    }}
                  >
                    {c.p5.toFixed(1)}
                  </span>
                </div>
                <div style={styles.scoreBar(c.p5, "#EF4444")} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CUSTOM INDEX BUILDER ────────────────────────────────────────────────────
function CustomIndexBuilder() {
  const defaultWeights = PILLARS.reduce((acc, p) => {
    acc[p.key] = p.weight;
    return acc;
  }, {});
  const [weights, setWeights] = useState(defaultWeights);
  const [preset, setPreset] = useState("official");

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);

  const normalize = (w) => {
    const total = Object.values(w).reduce((s, v) => s + v, 0);
    const out = {};
    Object.keys(w).forEach((k) => {
      out[k] = w[k] / total;
    });
    return out;
  };

  const computeCustomODEI = (country) => {
    const norm = normalize(weights);
    return PILLARS.reduce((s, p) => s + country[p.key] * norm[p.key], 0);
  };

  const customRanked = [...COUNTRIES]
    .map((c) => ({
      ...c,
      customScore: parseFloat(computeCustomODEI(c).toFixed(2)),
    }))
    .sort((a, b) => b.customScore - a.customScore)
    .map((c, i) => ({ ...c, customRank: i + 1, rankChange: c.rank - (i + 1) }));

  const PRESETS = {
    official: {
      label: "Official ODEI Weights",
      w: {
        p1: 15,
        p2: 15,
        p3: 10,
        p4: 10,
        p5: 5,
        p6: 15,
        p7: 10,
        p8: 10,
        p9: 10,
      },
    },
    govFocus: {
      label: "Governance-Focused",
      w: {
        p1: 25,
        p2: 10,
        p3: 10,
        p4: 20,
        p5: 5,
        p6: 10,
        p7: 5,
        p8: 5,
        p9: 10,
      },
    },
    innovFocus: {
      label: "Innovation-First",
      w: { p1: 10, p2: 10, p3: 15, p4: 5, p5: 25, p6: 20, p7: 5, p8: 5, p9: 5 },
    },
    inclusive: {
      label: "Digital Inclusion",
      w: {
        p1: 10,
        p2: 20,
        p3: 20,
        p4: 10,
        p5: 5,
        p6: 10,
        p7: 5,
        p8: 5,
        p9: 15,
      },
    },
    market: {
      label: "Market-Driven",
      w: {
        p1: 10,
        p2: 10,
        p3: 10,
        p4: 5,
        p5: 15,
        p6: 15,
        p7: 20,
        p8: 15,
        p9: 0,
      },
    },
  };

  const applyPreset = (key) => {
    setPreset(key);
    setWeights(PRESETS[key].w);
  };
  const topMoverUp = customRanked
    .filter((c) => c.rankChange > 0)
    .sort((a, b) => b.rankChange - a.rankChange)
    .slice(0, 5);
  const topMoverDown = customRanked
    .filter((c) => c.rankChange < 0)
    .sort((a, b) => a.rankChange - b.rankChange)
    .slice(0, 5);
  const compData = customRanked.slice(0, 20).map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    Official: parseFloat(c.adei.toFixed(1)),
    Custom: c.customScore,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          ...styles.card,
          borderColor: "#8B5CF640",
          background: "linear-gradient(135deg,#FFFFFF,#8B5CF608)",
        }}
      >
        <div style={{ ...styles.cardTitle, color: "#8B5CF6" }}>
          ⚗ Custom Index Builder — Sensitivity Analysis Tool
        </div>
        <p
          style={{
            color: "#475569",
            fontSize: "13px",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Re-weight the 9 pillars to see how rankings shift under alternative
          policy priorities. Use presets or manually adjust sliders. Weights
          auto-normalize to 100%. Essential for{" "}
          <strong style={{ color: "#C9A227" }}>
            academic sensitivity analysis
          </strong>{" "}
          and <strong style={{ color: "#C9A227" }}>scenario planning</strong>.
        </p>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>📋 Weight Presets</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "'Cinzel',serif",
                background: preset === key ? "#EEF2FF" : "transparent",
                borderColor: preset === key ? "#8B5CF6" : "#CBD5E1",
                color: preset === key ? "#8B5CF6" : "#64748B",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={styles.cardTitle}>🎛 Pillar Weights</div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: Math.abs(totalWeight - 100) < 1 ? "#10B981" : "#EF4444",
            }}
          >
            Total: {totalWeight}%{" "}
            {Math.abs(totalWeight - 100) < 1 ? "✓" : "(will auto-normalize)"}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "16px",
          }}
        >
          {PILLARS.map((p) => (
            <div key={p.key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{ fontSize: "12px", color: p.color, fontWeight: 600 }}
                >
                  {p.name}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 900,
                    color: "#1E293B",
                  }}
                >
                  {weights[p.key]}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={weights[p.key]}
                onChange={(e) => {
                  setPreset("custom");
                  setWeights((w) => ({
                    ...w,
                    [p.key]: parseInt(e.target.value),
                  }));
                }}
                style={{
                  width: "100%",
                  accentColor: p.color,
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  color: "#475569",
                }}
              >
                <span>0%</span>
                <span>Official: {p.weight}%</span>
                <span>40%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.grid2}>
        <div style={{ ...styles.card, borderColor: "#10B98140" }}>
          <div style={{ ...styles.cardTitle, color: "#10B981" }}>
            📈 Biggest Rank Gainers
          </div>
          {topMoverUp.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <div style={{ fontSize: "18px" }}>🟢</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#1E293B",
                      fontWeight: 600,
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#10B981",
                      fontWeight: 700,
                    }}
                  >
                    +{c.rankChange} places
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>
                  #{c.rank} → #{c.customRank} | {c.adei.toFixed(1)} →{" "}
                  {c.customScore.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...styles.card, borderColor: "#EF444440" }}>
          <div style={{ ...styles.cardTitle, color: "#EF4444" }}>
            📉 Biggest Rank Fallers
          </div>
          {topMoverDown.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <div style={{ fontSize: "18px" }}>🔴</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#1E293B",
                      fontWeight: 600,
                    }}
                  >
                    {c.name}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#EF4444",
                      fontWeight: 700,
                    }}
                  >
                    {c.rankChange} places
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>
                  #{c.rank} → #{c.customRank} | {c.adei.toFixed(1)} →{" "}
                  {c.customScore.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          📊 Official vs Custom Score — Leading 20 Countries
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={compData} barSize={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#475569", fontSize: 10 }}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", fontFamily: "'Cinzel',serif" }}
            />
            <Bar dataKey="Official" fill="#CBD5E1" />
            <Bar dataKey="Custom" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>🏆 Full Custom Rankings</div>
        <div
          style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead
              style={{ position: "sticky", top: 0, background: "#FFFFFF" }}
            >
              <tr style={{ borderBottom: "1px solid #C9A22740" }}>
                {[
                  "Custom #",
                  "Official #",
                  "Δ Rank",
                  "Country",
                  "Official Score",
                  "Custom Score",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 8px",
                      color: "#C9A227",
                      textAlign: "center",
                      fontFamily: "'Cinzel',serif",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customRanked.map((c, i) => (
                <tr
                  key={c.name}
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                    background: i % 2 === 0 ? "transparent" : "#64748B10",
                  }}
                >
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      fontWeight: 900,
                      color: "#8B5CF6",
                    }}
                  >
                    #{c.customRank}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      color: "#64748B",
                    }}
                  >
                    #{c.rank}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      fontWeight: 700,
                      color:
                        c.rankChange > 0
                          ? "#10B981"
                          : c.rankChange < 0
                            ? "#EF4444"
                            : "#64748B",
                    }}
                  >
                    {c.rankChange > 0
                      ? `+${c.rankChange}`
                      : c.rankChange === 0
                        ? "–"
                        : c.rankChange}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      color: "#1E293B",
                      fontWeight: 600,
                    }}
                  >
                    {c.name}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      color: "#C9A227",
                    }}
                  >
                    {c.adei.toFixed(1)}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      textAlign: "center",
                      fontWeight: 700,
                      color: "#8B5CF6",
                    }}
                  >
                    {c.customScore.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PRIORITY MATRIX ─────────────────────────────────────────────────────────
function PriorityMatrix() {
  const [selected, setSelected] = useState("Jordan");
  const country = COUNTRIES.find((c) => c.name === selected);
  const matrixData = PILLARS.map((p) => {
    const currentScore = country[p.key];
    const potential = 100 - currentScore;
    const regionPeers = COUNTRIES.filter(
      (c) =>
        REGIONS[c.name] === REGIONS[country.name] && c.name !== country.name,
    );
    const peerAvg = regionPeers.length
      ? regionPeers.reduce((s, c) => s + c[p.key], 0) / regionPeers.length
      : 50;
    const achievability = Math.min(100, (peerAvg / 100) * 100);
    const impact = (p.weight / 100) * potential;
    let quadrant = "";
    if (achievability >= 40 && impact >= 10) quadrant = "Quick Wins";
    else if (achievability < 40 && impact >= 10)
      quadrant = "Long-Term Investment";
    else if (achievability >= 40 && impact < 10) quadrant = "Low Priority";
    else quadrant = "Deprioritize";
    return {
      name: p.name,
      short: p.short,
      color: p.color,
      currentScore,
      potential,
      achievability,
      impact,
      quadrant,
      weight: p.weight,
    };
  });
  const QUADRANT_COLORS = {
    "Quick Wins": "#10B981",
    "Long-Term Investment": "#F59E0B",
    "Low Priority": "#3B82F6",
    Deprioritize: "#64748B",
  };
  const QUADRANT_DESC = {
    "Quick Wins": "High impact & achievable — Prioritize immediately",
    "Long-Term Investment":
      "High impact but difficult — Strategic multi-year focus",
    "Low Priority": "Achievable but lower reward — Maintain current effort",
    Deprioritize: "Low impact & difficult — Defer resources elsewhere",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <select
          style={styles.select}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {[...COUNTRIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>
        <div style={{ fontSize: "13px", color: "#64748B" }}>
          ODEI:{" "}
          <span style={{ color: "#C9A227", fontWeight: 700 }}>
            {country.adei.toFixed(1)}
          </span>{" "}
          | Rank{" "}
          <span style={{ color: "#C9A227", fontWeight: 700 }}>
            #{country.rank}
          </span>
        </div>
      </div>
      <div style={{ ...styles.card, borderColor: "#C9A22740" }}>
        <div style={styles.cardTitle}>
          📌 Priority Matrix — Impact vs. Achievability for {country.name}
        </div>
        <div
          style={{
            position: "relative",
            height: "420px",
            background: "#F1F5F9",
            borderRadius: "10px",
            padding: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: "1px",
              background: "#CBD5E1",
              transform: "translateX(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "1px",
              background: "#CBD5E1",
              transform: "translateY(-50%)",
            }}
          />
          {[
            { label: "🚀 Quick Wins", x: "75%", y: "10%", color: "#10B981" },
            {
              label: "🏗 Long-Term Investment",
              x: "15%",
              y: "10%",
              color: "#F59E0B",
            },
            { label: "📌 Low Priority", x: "75%", y: "85%", color: "#3B82F6" },
            { label: "⬇ Deprioritize", x: "15%", y: "85%", color: "#64748B" },
          ].map((q) => (
            <div
              key={q.label}
              style={{
                position: "absolute",
                left: q.x,
                top: q.y,
                fontSize: "11px",
                fontWeight: 700,
                color: q.color,
                transform: "translateX(-50%)",
                fontFamily: "'Cinzel',serif",
                whiteSpace: "nowrap",
              }}
            >
              {q.label}
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              bottom: "4px",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: "11px",
              color: "#64748B",
            }}
          >
            ← Low Achievability | High Achievability →
          </div>
          <div
            style={{
              position: "absolute",
              left: "4px",
              top: "50%",
              transform: "translateY(-50%) rotate(-90deg)",
              fontSize: "11px",
              color: "#64748B",
              whiteSpace: "nowrap",
            }}
          >
            ← Low Impact | High Impact →
          </div>
          {matrixData.map((d) => {
            const x = (d.achievability / 100) * 88 + 6;
            const y = 92 - (d.impact / 20) * 80;
            return (
              <div
                key={d.name}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%,-50%)",
                  zIndex: 10,
                }}
              >
                <div
                  title={`${d.name}: Score ${d.currentScore.toFixed(0)}, Impact ${d.impact.toFixed(1)}`}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: d.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "#F8FAFC",
                    textAlign: "center",
                    lineHeight: 1.1,
                    border: "2px solid #F8FAFC",
                    boxShadow: `0 0 12px ${d.color}60`,
                    cursor: "pointer",
                  }}
                >
                  {d.short.slice(0, 6)}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "-20px",
                    transform: "translateX(-50%)",
                    fontSize: "9px",
                    color: d.color,
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                  }}
                >
                  {d.currentScore.toFixed(0)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
      >
        {Object.entries(QUADRANT_COLORS).map(([q, color]) => {
          const items = matrixData.filter((d) => d.quadrant === q);
          return (
            <div key={q} style={{ ...styles.card, borderColor: `${color}40` }}>
              <div style={{ ...styles.cardTitle, color }}>{q}</div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#64748B",
                  marginBottom: "10px",
                }}
              >
                {QUADRANT_DESC[q]}
              </div>
              {items.map((d) => (
                <div
                  key={d.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: "1px solid #F1F5F9",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: d.color, fontWeight: 600 }}>
                    {d.name}
                  </span>
                  <span style={{ color: "#64748B" }}>
                    Score: {d.currentScore.toFixed(0)} | Gap:{" "}
                    {d.potential.toFixed(0)}
                  </span>
                </div>
              ))}
              {items.length === 0 && (
                <div style={{ color: "#475569", fontSize: "12px" }}>
                  None in this quadrant
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PEER LEARNING ────────────────────────────────────────────────────────────
function PeerLearning() {
  const [selected, setSelected] = useState("Egypt");
  const [pillarFocus, setPillarFocus] = useState("p4");
  const country = COUNTRIES.find((c) => c.name === selected);
  const focusPillar = PILLARS.find((p) => p.key === pillarFocus);
  const peers = COUNTRIES.filter(
    (c) =>
      c.name !== selected &&
      Math.abs(c.adei - country.adei) <= 15 &&
      c[pillarFocus] > country[pillarFocus],
  )
    .sort((a, b) => b[pillarFocus] - a[pillarFocus])
    .slice(0, 6);
  const radarData = PILLARS.map((p) => {
    const row = {
      subject: p.short,
      [country.name]: parseFloat(country[p.key].toFixed(1)),
    };
    peers.slice(0, 3).forEach((peer) => {
      row[peer.name] = parseFloat(peer[p.key].toFixed(1));
    });
    return row;
  });
  const PEER_COLORS = [
    "#C9A227",
    "#10B981",
    "#3B82F6",
    "#EF4444",
    "#8B5CF6",
    "#F97316",
  ];
  const CASE_STUDIES = {
    p1: {
      country: "Malaysia",
      lesson:
        "Established the Malaysia Digital Economy Blueprint (MyDIGITAL) with clear KPIs, transparent regulatory sandbox, and multi-ministry digital coordination.",
    },
    p2: {
      country: "UAE",
      lesson:
        "UAE Digital Infrastructure Strategy 2031 mandated 5G coverage for all populated areas, subsidized fiber to underserved zones through universal service obligations.",
    },
    p3: {
      country: "Jordan",
      lesson:
        "Jordan Digital Skills Initiative partnered with Google, Microsoft & Coursera to certify 100,000+ youth. Dedicated tech parks attracted diaspora talent.",
    },
    p4: {
      country: "Saudi Arabia",
      lesson:
        "Absher platform digitized 70+ government services. National digital ID became foundational for e-service delivery. E-procurement mandatory for government contracts.",
    },
    p5: {
      country: "Türkiye",
      lesson:
        "Technology Development Zones offer 5-year tax holidays for R&D companies. TUBITAK grants fund 75% of SME innovation projects.",
    },
    p6: {
      country: "UAE",
      lesson:
        "UAE National AI Strategy 2031 — designated AI minister, mandatory AI procurement for federal agencies, partnerships with MIT/Oxford for AI research hubs.",
    },
    p7: {
      country: "Indonesia",
      lesson:
        "Making Indonesia 4.0 roadmap streamlined e-commerce regulations, created unicorn accelerator program, and lowered barriers for digital MSMEs through OSS licensing.",
    },
    p8: {
      country: "Malaysia",
      lesson:
        "Malaysia Islamic Fintech regulatory sandbox attracted 60+ licensed digital Islamic banks. Shariah-compliant robo-advisory and halal payment systems grew 340% since 2019.",
    },
    p9: {
      country: "Senegal",
      lesson:
        "Digital Senegal 2025 leveraged mobile money (Wave) for government social transfers, achieving 8M+ unbanked citizens' financial inclusion and connecting 2,000+ schools via 4G.",
    },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <select
          style={styles.select}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {[...COUNTRIES]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>
        <span style={{ color: "#64748B", fontSize: "13px" }}>
          wants to learn about →
        </span>
        <select
          style={styles.select}
          value={pillarFocus}
          onChange={(e) => setPillarFocus(e.target.value)}
        >
          {PILLARS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div style={styles.grid2}>
        <div style={{ ...styles.card, borderColor: `${focusPillar.color}40` }}>
          <div style={{ ...styles.cardTitle, color: focusPillar.color }}>
            🎯 {country.name} — Current Status
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {[
              { label: "ODEI Rank", value: `#${country.rank}` },
              { label: "ODEI Score", value: country.adei.toFixed(1) },
              {
                label: `${focusPillar.name} Score`,
                value: country[pillarFocus].toFixed(1),
              },
              {
                label: "Gap to OIC Leader",
                value: `-${(Math.max(...COUNTRIES.map((c) => c[pillarFocus])) - country[pillarFocus]).toFixed(1)}`,
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#F1F5F9",
                  borderRadius: "8px",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 900,
                    color: focusPillar.color,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {peers.length > 0 ? (
        <>
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              🤝 Best Peer Learners — Similar ODEI, Stronger in{" "}
              {focusPillar.name}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: "12px",
              }}
            >
              {peers.map((peer, i) => (
                <div
                  key={peer.name}
                  style={{
                    background: "#F1F5F9",
                    borderRadius: "10px",
                    padding: "14px",
                    border: `1px solid ${PEER_COLORS[i]}40`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#1E293B",
                      }}
                    >
                      {peer.name}
                    </span>
                    <span
                      style={{
                        ...styles.badge(PEER_COLORS[i], "#FFFFFF"),
                        fontSize: "11px",
                      }}
                    >
                      #{peer.rank}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      ODEI Score
                    </span>
                    <span style={{ fontSize: "12px", color: "#C9A227" }}>
                      {peer.adei.toFixed(1)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      {focusPillar.short}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: PEER_COLORS[i],
                      }}
                    >
                      {peer[pillarFocus].toFixed(1)}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#10B981" }}>
                    +{(peer[pillarFocus] - country[pillarFocus]).toFixed(1)} pts
                    ahead
                  </div>
                  <div
                    style={styles.scoreBar(peer[pillarFocus], PEER_COLORS[i])}
                  />
                </div>
              ))}
            </div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              📡 Profile Comparison — {country.name} vs. Peer Learners
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#CBD5E1" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#475569", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: "#64748B", fontSize: 9 }}
                />
                <Radar
                  name={country.name}
                  dataKey={country.name}
                  stroke="#C9A227"
                  fill="#C9A227"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                {peers.slice(0, 3).map((peer, i) => (
                  <Radar
                    key={peer.name}
                    name={peer.name}
                    dataKey={peer.name}
                    stroke={PEER_COLORS[i + 1]}
                    fill={PEER_COLORS[i + 1]}
                    fillOpacity={0.1}
                  />
                ))}
                <Legend
                  wrapperStyle={{
                    fontSize: "11px",
                    fontFamily: "'Cinzel',serif",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div style={{ ...styles.card, textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🏆</div>
          <div style={{ fontSize: "16px", color: "#C9A227", fontWeight: 700 }}>
            No peer learners found
          </div>
          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "8px" }}>
            {country.name} is among the leading performers in {focusPillar.name}{" "}
            relative to similar ODEI countries.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROGRESS TRACKER ────────────────────────────────────────────────────────
function ProgressTracker({ hideTrajectory = false }) {
  const TREND_FULL = {
    "United Arab Emirates": [63.5, 67.2, 71.0, 73.7, 76.84],
    "Saudi Arabia": [56.9, 60.0, 62.5, 65.5, 67.77],
    Malaysia: [60.1, 63.0, 65.0, 67.0, 66.98],
    Indonesia: [50.2, 53.0, 56.0, 58.6, 61.57],
    Qatar: [47.0, 49.0, 51.0, 53.0, 55.14],
    Türkiye: [52.0, 55.0, 57.5, 59.0, 60.99],
    Kazakhstan: [48.0, 51.0, 54.0, 56.0, 57.86],
    Jordan: [44.0, 47.0, 49.5, 51.0, 52.94],
    Tunisia: [43.0, 45.0, 47.5, 49.0, 50.26],
    Morocco: [40.0, 42.0, 44.5, 46.0, 47.74],
    Oman: [42.0, 43.5, 44.8, 45.5, 46.42],
    Uzbekistan: [38.0, 40.0, 42.0, 43.5, 45.34],
    Bahrain: [40.0, 41.5, 42.8, 43.5, 44.17],
    Egypt: [35.0, 37.0, 38.5, 39.5, 40.9],
    Kuwait: [37.0, 38.0, 38.8, 39.0, 39.42],
    Albania: [40.0, 41.5, 42.5, 43.8, 45.34],
    Senegal: [28.0, 29.5, 31.0, 32.0, 33.35],
    Nigeria: [22.0, 23.5, 24.5, 25.5, 26.76],
    Bangladesh: [18.0, 19.0, 20.0, 20.8, 21.64],
    Somalia: [9.0, 9.5, 10.0, 10.5, 10.91],
  };
  const YEARS_L = ["2021", "2022", "2023", "2024", "2025"];
  const scoreChange = (name) => {
    const h = TREND_FULL[name];
    return h ? parseFloat((h[4] - h[0]).toFixed(2)) : 0;
  };
  const sorted = [...COUNTRIES].sort((a, b) => b.adei - a.adei);
  const lineData = YEARS_L.map((yr, yi) => {
    const row = { year: yr };
    Object.entries(TREND_FULL).forEach(([name, scores]) => {
      row[name] = scores[yi];
    });
    return row;
  });
  const fastestGrowing = [...COUNTRIES]
    .filter((c) => TREND_FULL[c.name])
    .map((c) => ({ ...c, growth: scoreChange(c.name) }))
    .sort((a, b) => b.growth - a.growth);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {!hideTrajectory && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>📈 Score Trajectory 2021–2025</div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
              <XAxis dataKey="year" tick={{ fill: "#475569", fontSize: 11 }} />
              <YAxis
                domain={[0, 85]}
                tick={{ fill: "#475569", fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              {Object.keys(TREND_FULL)
                .slice(0, 10)
                .map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={PILLARS[i % PILLARS.length].color}
                    strokeWidth={1.5}
                    dot={{ r: 2 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div style={styles.card}>
        <div style={styles.cardTitle}>🔄 Score Change 2021 → 2025</div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #C9A22740" }}>
                {[
                  "Country",
                  "2025 Rank",
                  "2025 Score",
                  "4yr Change",
                  "Trajectory",
                  "Cluster",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 8px",
                      color: "#C9A227",
                      textAlign: "center",
                      fontFamily: "'Cinzel',serif",
                      fontSize: "11px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const hist = TREND_FULL[c.name];
                const change = hist ? scoreChange(c.name) : null;
                const cl = getCluster(c.adei);
                return (
                  <tr
                    key={c.name}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      background: i % 2 === 0 ? "transparent" : "#64748B10",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px",
                        color: "#1E293B",
                        fontWeight: 600,
                      }}
                    >
                      {c.name}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        color: "#C9A227",
                        fontWeight: 700,
                      }}
                    >
                      #{c.rank}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: cl.color,
                      }}
                    >
                      {c.adei.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontWeight: 700,
                        color:
                          change === null
                            ? "#64748B"
                            : change >= 0
                              ? "#10B981"
                              : "#EF4444",
                      }}
                    >
                      {change === null
                        ? "N/A"
                        : change >= 0
                          ? `+${change}`
                          : change}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        fontSize: "10px",
                        color: "#64748B",
                        fontFamily: "monospace",
                      }}
                    >
                      {hist ? hist.map((v) => v.toFixed(0)).join("→") : "N/A"}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>
                      <span
                        style={{
                          ...styles.badge(cl.color, cl.bg),
                          fontSize: "9px",
                        }}
                      >
                        {cl.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={styles.card}>
        <div style={{ ...styles.cardTitle, color: "#10B981" }}>
          🚀 Fastest Growing Countries (4-Year Score Gain)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={fastestGrowing.map((c) => ({
              name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
              growth: c.growth,
            }))}
            barSize={28}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#475569", fontSize: 10 }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fill: "#475569", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="growth" name="Score Gain (2021–2025)">
              {fastestGrowing.map((c, i) => (
                <Cell key={i} fill={c.growth > 0 ? "#10B981" : "#EF4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── STATISTICAL ANALYSIS ─────────────────────────────────────────────────────
function StatisticalAnalysis() {
  const corr = (k1, k2) => {
    const xs = COUNTRIES.map((c) => c[k1]);
    const ys = COUNTRIES.map((c) => c[k2]);
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const den = Math.sqrt(
      xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
        ys.reduce((s, y) => s + (y - my) ** 2, 0),
    );
    return den === 0 ? 0 : parseFloat((num / den).toFixed(2));
  };
  const corrMatrix = PILLARS.map((p1) => ({
    name: p1.short,
    ...PILLARS.reduce((acc, p2) => {
      acc[p2.short] = corr(p1.key, p2.key);
      return acc;
    }, {}),
  }));
  const corrColor = (v) =>
    v >= 0.7
      ? "#10B981"
      : v >= 0.4
        ? "#3B82F6"
        : v >= 0
          ? "#64748B"
          : v >= -0.4
            ? "#F59E0B"
            : "#EF4444";
  const descStats = PILLARS.map((p) => {
    const vals = COUNTRIES.map((c) => c[p.key]).sort((a, b) => a - b);
    const mean = vals.reduce((a, b) => a + b) / vals.length;
    const variance =
      vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    return {
      name: p.short,
      color: p.color,
      mean: mean.toFixed(1),
      median: vals[Math.floor(vals.length / 2)].toFixed(1),
      sd: Math.sqrt(variance).toFixed(1),
      min: vals[0].toFixed(1),
      max: vals[vals.length - 1].toFixed(1),
      q1: vals[Math.floor(vals.length * 0.25)].toFixed(1),
      q3: vals[Math.floor(vals.length * 0.75)].toFixed(1),
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          📊 Descriptive Statistics — All 9 Pillars (n=57)
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #C9A22740" }}>
                {[
                  "Pillar",
                  "Mean",
                  "Median",
                  "Std Dev",
                  "Min",
                  "Q1",
                  "Q3",
                  "Max",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 8px",
                      color: "#C9A227",
                      textAlign: "center",
                      fontFamily: "'Cinzel',serif",
                      fontSize: "11px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {descStats.map((s, i) => (
                <tr
                  key={s.name}
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                    background: i % 2 === 0 ? "transparent" : "#64748B10",
                  }}
                >
                  <td
                    style={{ padding: "8px", color: s.color, fontWeight: 700 }}
                  >
                    {s.name}
                  </td>
                  {[s.mean, s.median, s.sd, s.min, s.q1, s.q3, s.max].map(
                    (v, vi) => (
                      <td
                        key={vi}
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          color: "#1E293B",
                        }}
                      >
                        {v}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>🔗 Inter-Pillar Correlation Matrix</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 10px", color: "#C9A227" }}>
                  Pillar
                </th>
                {PILLARS.map((p) => (
                  <th
                    key={p.key}
                    style={{
                      padding: "6px 8px",
                      color: p.color,
                      fontSize: "10px",
                      textAlign: "center",
                    }}
                  >
                    {p.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corrMatrix.map((row, ri) => (
                <tr key={row.name}>
                  <td
                    style={{
                      padding: "5px 10px",
                      color: PILLARS[ri].color,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.name}
                  </td>
                  {PILLARS.map((p2) => {
                    const v = row[p2.short];
                    const absV = Math.abs(v);
                    return (
                      <td
                        key={p2.key}
                        style={{ padding: "4px", textAlign: "center" }}
                      >
                        <div
                          style={{
                            background: `${corrColor(v)}${Math.round(absV * 200)
                              .toString(16)
                              .padStart(2, "0")}`,
                            borderRadius: "4px",
                            padding: "4px 6px",
                            color: "#1E293B",
                            fontWeight: v === 1 ? 900 : 600,
                            fontSize: "11px",
                          }}
                        >
                          {v}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            {[
              ["#10B981", "Strong ≥0.7"],
              ["#3B82F6", "Moderate 0.4–0.7"],
              ["#64748B", "Low 0–0.4"],
              ["#EF4444", "Negative <0"],
            ].map(([c, l]) => (
              <div
                key={l}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  color: "#64748B",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    background: c,
                    borderRadius: "2px",
                  }}
                />
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── METHODOLOGY ──────────────────────────────────────────────────────────────
function Methodology() {
  const [openSection, setOpenSection] = useState("index");
  const SOURCES = [
    {
      indicator: "Political Stability & Security",
      code: "1.1.1",
      source: "World Bank WGI, 2025",
    },
    {
      indicator: "Government Effectiveness",
      code: "1.1.2",
      source: "World Bank WGI, 2025",
    },
    {
      indicator: "Voice & Accountability",
      code: "1.1.3",
      source: "World Bank WGI, 2025",
    },
    {
      indicator: "Regulatory Quality",
      code: "1.2.1",
      source: "World Bank WGI, 2025",
    },
    { indicator: "Rule of Law", code: "1.2.2", source: "World Bank WGI, 2025" },
    {
      indicator: "E-Government Development",
      code: "4.1–4.3",
      source: "UN E-Government Development Index (EGDI), 2025",
    },
    {
      indicator: "R&D Business Financing",
      code: "5.1",
      source: "UNESCO Institute for Statistics, 2025",
    },
    {
      indicator: "University-Industry Collaboration",
      code: "5.2",
      source: "World Economic Forum GCI, 2025",
    },
    {
      indicator: "Mobile Subscriptions / Internet",
      code: "2.x",
      source: "International Telecommunication Union (ITU), 2025",
    },
    {
      indicator: "Financial Market Development",
      code: "8.x",
      source: "IMF Financial Access Survey; World Bank Findex, 2025",
    },
    {
      indicator: "SDG ICT Indicators",
      code: "9.1–9.7",
      source: "UN SDG Global Database; ITU, 2025",
    },
  ];
  const sections = {
    index: {
      title: "📐 Index Structure",
      content: (
        <div>
          <p style={{ color: "#475569", fontSize: "13px", lineHeight: 1.8 }}>
            The ODEI, developed by Al-Khouri (2024), measures digital economy
            maturity of OIC member states through{" "}
            <strong style={{ color: "#C9A227" }}>
              9 pillars, 32 indicators, and 21 sub-indicators
            </strong>
            . The 2025 edition covers all 57 OIC member states using lagged
            annual data.
          </p>
          {PILLARS.map((p) => (
            <div
              key={p.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 0",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: p.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, fontSize: "13px", color: "#1E293B" }}>
                <strong style={{ color: p.color }}>Pillar {p.id}:</strong>{" "}
                {p.name}
              </div>
              <div style={{ fontSize: "12px", color: "#64748B" }}>
                Weight: {p.weight}%
              </div>
              <div style={{ fontSize: "11px", color: "#475569" }}>{p.dim}</div>
            </div>
          ))}
        </div>
      ),
    },
    normalization: {
      title: "⚗ Normalization",
      content: (
        <div>
          <p style={{ color: "#475569", fontSize: "13px", lineHeight: 1.8 }}>
            All indicators normalized to{" "}
            <strong style={{ color: "#C9A227" }}>0–100 scale</strong> using
            min-max normalization:
          </p>
          <div
            style={{
              background: "#F1F5F9",
              borderRadius: "8px",
              padding: "16px",
              margin: "12px 0",
              fontFamily: "monospace",
              fontSize: "13px",
              color: "#10B981",
              border: "1px solid #CBD5E1",
            }}
          >
            Score = (X - X_min) / (X_max - X_min) × 100
          </div>
          <p style={{ color: "#475569", fontSize: "13px", lineHeight: 1.8 }}>
            For negative indicators: Score = (X_max - X) / (X_max - X_min) ×
            100. Missing values are imputed using weighted averages of available
            sub-indicators within the same pillar, or regional median if the
            entire pillar is missing.
          </p>
          <div
            style={{
              background: "#F1F5F9",
              borderRadius: "8px",
              padding: "16px",
              margin: "12px 0",
              fontFamily: "monospace",
              fontSize: "13px",
              color: "#10B981",
              border: "1px solid #CBD5E1",
            }}
          >
            ODEI = Σ (Pillar_Score_i × Weight_i) for i = 1 to 9
          </div>
        </div>
      ),
    },
    clusters: {
      title: "🗂 Cluster Methodology",
      content: (
        <div>
          <p style={{ color: "#475569", fontSize: "13px", lineHeight: 1.8 }}>
            Countries classified into three clusters based on 2025 Index scores:
          </p>
          {[
            {
              label: "Advanced Digital Economies",
              range: "Score ≥ 60",
              color: "#10B981",
              desc: "Leading 6 states with global competitiveness in AI, E-Government, and digital infrastructure. Strategic priority: global innovation leadership.",
            },
            {
              label: "Emerging Digital Economies",
              range: "Score 40–59",
              color: "#F59E0B",
              desc: "15 member states with solid digital foundations but bottlenecked by limited R&D, advanced skills, and venture capital. Priority: scaling private-sector digital adoption.",
            },
            {
              label: "Emerging Digital Economies",
              range: "Score < 40",
              color: "#EF4444",
              desc: "Majority of OIC states (36) in early transformation. Constrained by infrastructure deficits and low digital literacy. Priority: foundational digital infrastructure.",
            },
          ].map((cl) => (
            <div
              key={cl.label}
              style={{
                background: "#F1F5F9",
                borderRadius: "8px",
                padding: "14px",
                marginBottom: "10px",
                border: `1px solid ${cl.color}30`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    ...styles.badge(cl.color, `${cl.color}20`),
                    fontSize: "11px",
                  }}
                >
                  {cl.label}
                </span>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  {cl.range}
                </span>
              </div>
              <p
                style={{
                  color: "#475569",
                  fontSize: "12px",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {cl.desc}
              </p>
            </div>
          ))}
        </div>
      ),
    },
    sources: {
      title: "📚 Data Sources",
      content: (
        <div>
          <p style={{ color: "#475569", fontSize: "13px", lineHeight: 1.8 }}>
            All data sourced from internationally recognized, publicly available
            datasets. The 2025 edition uses lagged data primarily from 2023–2024
            reporting periods.
          </p>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              marginTop: "12px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #C9A22740" }}>
                {["Indicator", "Code", "Source"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px",
                      color: "#C9A227",
                      textAlign: "left",
                      fontFamily: "'Cinzel',serif",
                      fontSize: "11px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                    background: i % 2 === 0 ? "transparent" : "#64748B10",
                  }}
                >
                  <td style={{ padding: "7px 8px", color: "#1E293B" }}>
                    {s.indicator}
                  </td>
                  <td
                    style={{
                      padding: "7px 8px",
                      color: "#C9A227",
                      fontFamily: "monospace",
                    }}
                  >
                    {s.code}
                  </td>
                  <td style={{ padding: "7px 8px", color: "#475569" }}>
                    {s.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  };

  return (
    <div style={{ display: "flex", gap: "16px" }}>
      <div style={{ width: "220px", flexShrink: 0 }}>
        <div style={styles.card}>
          {Object.entries(sections).map(([key, s]) => (
            <button
              key={key}
              onClick={() => setOpenSection(key)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "'Cinzel',serif",
                background: openSection === key ? "#EEF2FF" : "transparent",
                color: openSection === key ? "#C9A227" : "#64748B",
                borderLeft:
                  openSection === key
                    ? "3px solid #C9A227"
                    : "3px solid transparent",
                marginBottom: "4px",
              }}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, ...styles.card }}>
        <div style={styles.cardTitle}>{sections[openSection].title}</div>
        {sections[openSection].content}
      </div>
    </div>
  );
}

// ─── TABS CONFIG ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "🌍 Global Overview", component: GlobalOverview },
  { id: "profiles", label: "📄 Country Profiles", component: CountryProfiles },
  { id: "compare", label: "🆚 Compare Countries", component: CompareCountries },
  { id: "pillar", label: "🏛 Pillar Analysis", component: PillarAnalysis },
  { id: "geo", label: "🗺 Geographic Analysis", component: GeographicAnalysis },
  { id: "trends", label: "📈 Trends & Progress", component: TrendsProgress },
  {
    id: "rankings",
    label: "🏆 Rankings Explorer",
    component: RankingsExplorer,
  },
  /* {
    id: "policy",
    label: "💻 Policy Recommendations",
    component: PolicyRecommendations,
  }, */
  { id: "divide", label: "⚡ Digital Divide", component: DigitalDivide },
  /* {
    id: "islamic",
    label: "🕌 Islamic Digital Special",
    component: IslamicDigitalSpecial,
  }, */
  {
    id: "builder",
    label: "⚗ Custom Index Builder",
    component: CustomIndexBuilder,
  },
  /* { id: "matrix", label: "📌 Priority Matrix", component: PriorityMatrix }, */
  { id: "peers", label: "🤝 Peer Learning", component: PeerLearning },
  /* { id: "progress", label: "📈 Progress Tracker", component: ProgressTracker }, */
  {
    id: "stats",
    label: "📐 Statistical Analysis",
    component: StatisticalAnalysis,
  },
  { id: "methodology", label: "🔬 Methodology", component: Methodology },
];

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const tab = TABS.find((t) => t.id === activeTab);
  const Component = tab.component;

  return (
    <div style={styles.app}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F8FAFC; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #C9A227; }
        select option { background: #FFFFFF; color: #1E293B; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerPattern} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "36px" }}>🌙</div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Cinzel', serif",
                  fontSize: "22px",
                  fontWeight: 900,
                  color: "#C9A227",
                  letterSpacing: "0.08em",
                }}
              >
                OIC DIGITAL ECONOMY INDEX
              </h1>
              <div
                style={{
                  fontFamily: "'Crimson Text', serif",
                  fontSize: "15px",
                  color: "#475569",
                  marginTop: "2px",
                  fontStyle: "italic",
                }}
              >
                OIC Digital Economy Index (OIC DEI) · 57 Member States · 2025
                Assessment
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: "13px", color: "#64748B" }}>
                OIC Average
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  color: "#C9A227",
                  fontFamily: "'Cinzel', serif",
                }}
              >
                {OIC_AVERAGE.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            style={styles.tab(activeTab === t.id)}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        <Component />
      </div>
    </div>
  );
}
