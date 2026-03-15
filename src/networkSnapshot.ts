// Shared network snapshot builder — used by HomeApp and SlatePlatform

const slateRead = (key: string) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
};

export const buildNetworkSnapshot = () => {
  const adminEnroll  = slateRead('slate_enrollment');
  const adminFin     = slateRead('slate_financials');
  const adminStaff   = slateRead('slate_staff');
  const adminRisks   = slateRead('slate_risks');
  const adminNetwork = slateRead('slate_network');

  const networkName  = adminNetwork?.name           ?? 'Veritas Charter Schools';
  const campusCount  = adminNetwork?.campusCount    ?? 10;
  const studentCount = adminEnroll?.networkTotal    ?? adminNetwork?.studentCount ?? 6823;
  const targetEnroll = adminEnroll?.targetEnrollment ?? 6823;
  const currentEnroll= adminEnroll?.networkTotal    ?? 6823;
  const enrollGap    = currentEnroll - targetEnroll;
  const rpp          = adminNetwork?.revenuePerPupil ?? 16345;
  const revenueAtRisk= Math.abs(enrollGap) * rpp;

  const ytdExpActual = adminFin?.ytdExpActual  ?? 75500000;
  const ytdExpBudget = adminFin?.ytdExpBudget  ?? 74200000;
  const ytdSurplus   = adminFin?.ytdSurplus    ?? 5300000;
  const dscr         = adminFin?.dscr          ?? 3.47;
  const daysCash     = adminFin?.daysCashOnHand ?? 62;
  const budgetVar    = ytdExpBudget > 0
    ? parseFloat(((ytdExpActual - ytdExpBudget) / ytdExpBudget * 100).toFixed(1))
    : -3.8;
  const budgetVarDir = budgetVar <= 0 ? 'under' : 'over';

  const riskCampuses     = adminRisks?.campuses ?? [];
  const elevatedCampuses = riskCampuses.filter((c: any) => c.alertLevel === 'high').map((c: any) => c.name);
  const atRiskCount      = elevatedCampuses.length;
  const retalCampus      = elevatedCampuses[0] ?? 'Garfield Park';

  return {
    generatedAt: new Date().toISOString(),
    network: networkName, campusCount, studentCount,
    watch: {
      networksAtRisk: atRiskCount,
      criticalCampuses: [],
      elevatedCampuses: elevatedCampuses.length > 0 ? elevatedCampuses : ["Garfield Park","Englewood"],
      clearCampuses: campusCount - atRiskCount,
      activeRetaliationWindows: 1,
      retaliationCampus: retalCampus,
      retaliationPhase: "WATCH",
      retaliationHoursRemaining: 52,
      lastIncident: `Weapons arrest 0.4mi from ${retalCampus} at 11:42pm`,
      overallStatus: atRiskCount >= 2 ? "ELEVATED" : atRiskCount >= 1 ? "WATCH" : "CLEAR",
    },
    ledger: {
      budgetVariance: Math.abs(budgetVar),
      budgetVarianceDirection: budgetVarDir,
      cashDaysOnHand: daysCash,
      covenantStatus: dscr >= 1.0 ? "COMPLIANT" : "BREACH",
      dscrProjected: dscr,
      personnelOverBudget: false,
      topVarianceItem: "Substitute costs tracking 12% above trend",
      ytdExpenses: ytdExpActual,
      ytdBudget: ytdExpBudget,
      quarterlyStatus: ytdSurplus >= 0 ? "On Track" : "Watch",
    },
    roster: {
      enrollmentVsProjection: enrollGap,
      enrollmentProjection: targetEnroll,
      currentEnrollment: currentEnroll,
      revenueAtRisk,
      atRiskCampuses: ["North Lawndale","Roseland"],
      yieldTracking: "8% below last year in 9th grade",
      attritionFlags: 3,
      octCountDaysOut: 22,
    },
    guard: {
      deadlinesNext30Days: 3, overdueItems: 0,
      urgentDeadlines: [
        { item:"Annual Title I Compliance Report",          daysOut:7,  owner:"COO"       },
        { item:"Authorizer Financial Benchmark Submission", daysOut:14, owner:"CFO"       },
        { item:"Board Governance Self-Assessment",          daysOut:28, owner:"President" },
      ],
      auditReadiness: 78, openPolicies: 4,
    },
    grounds: {
      openWorkOrders:9, urgentWorkOrders:2,
      urgentItems:["HVAC failure - Austin 3rd floor","Water main leak - Loop campus"],
      capitalProjectsActive:3, capitalProjectsOnBudget:2, vendorContractsExpiring:1,
    },
    civic: {
      billsInCommittee:2,
      pendingBills:[
        {name:"HB 4821",summary:"Charter authorization renewal process changes",risk:"WATCH"},
        {name:"SB 2907",summary:"Per-pupil funding equity adjustment",risk:"POSITIVE"},
      ],
      upcomingHearings:1, hearingDate:"March 18",
      hearingTopic:"Charter Funding Equity Subcommittee",
      staleStakeholderRelationships:3,
      mediaMonitoring:"No active coverage. One pending Chalkbeat inquiry.",
    },
    raise: {
      pipelineWeighted:4200000, pipelineGoal:10000000, pipelineGoalPct:42,
      closedYTD:1850000, proposalsSubmitted:4, proposalsDueSoon:2,
      dueSoonItems:[
        {funder:"MacArthur Foundation",amount:250000,daysOut:6},
        {funder:"ISBE Innovation Grant",amount:175000,daysOut:11},
      ],
      overdueReports:0, grantScanLastRun:"Today", newOpportunitiesFound:3,
    },
  };
};
