import publicViews from "./registry.public.js";
import PolicyRecommendations from "./PolicyRecommendations.jsx";
import CustomIndexBuilder from "./CustomIndexBuilder.jsx";
import PeerLearning from "./PeerLearning.jsx";
import StatisticalAnalysis from "./StatisticalAnalysis.jsx";
import Methodology from "./Methodology.jsx";
import ReportDownloads from "./ReportDownloads.jsx";
import WhatIfCalculator from "./WhatIfCalculator.jsx";
import DataQualityExplorer from "./DataQualityExplorer.jsx";
import UpdateHistory from "./UpdateHistory.jsx";

export default { ...publicViews,
  policy: PolicyRecommendations, builder: CustomIndexBuilder, peers: PeerLearning,
  stats: StatisticalAnalysis, methodology: Methodology, reports: ReportDownloads,
  whatif: WhatIfCalculator, quality: DataQualityExplorer, history: UpdateHistory,
};
