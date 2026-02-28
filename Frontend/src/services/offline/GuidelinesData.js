/**
 * GuidelinesData - Embedded pregnancy guidelines for offline vector search
 * Contains pregnancy guidelines from MoHFW, FOGSI, WHO, and other organizations
 */

export const PREGNANCY_GUIDELINES = [
  {
    id: 'guideline_0',
    title: 'Initial Registration & Prenatal Checkup',
    week_range: '6-8',
    priority: 'high',
    organization: ['MoHFW', 'FOGSI'],
    purpose: 'Confirm pregnancy, estimate due date, record vitals',
    content: 'During weeks 6-8, schedule your first prenatal visit to confirm pregnancy, estimate your due date, and record baseline vitals including weight, blood pressure, and medical history.'
  },
  {
    id: 'guideline_1',
    title: 'Hemoglobin & Blood Group Test',
    week_range: '8-12',
    priority: 'high',
    organization: ['MoHFW', 'WHO'],
    purpose: 'Detect anemia and Rh factor',
    content: 'Between weeks 8-12, get blood tests to check hemoglobin levels (to detect anemia) and determine your blood group including Rh factor. This is crucial for planning any interventions if needed.'
  },
  {
    id: 'guideline_2',
    title: 'Infectious Disease Screening (HIV, HBsAg, VDRL)',
    week_range: '8-12',
    priority: 'high',
    organization: ['NACO', 'WHO', 'ICMR'],
    purpose: 'Check for infectious diseases',
    content: 'Screen for infectious diseases including HIV, Hepatitis B (HBsAg), and Syphilis (VDRL) during weeks 8-12. Early detection allows for appropriate management to protect both mother and baby.'
  },
  {
    id: 'guideline_3',
    title: 'NT Scan + Dual Marker Test',
    week_range: '11-14',
    priority: 'high',
    organization: ['FOGSI'],
    purpose: 'Screen for chromosomal abnormalities',
    content: 'The Nuchal Translucency (NT) scan combined with dual marker blood test during weeks 11-14 helps screen for chromosomal abnormalities like Down syndrome. This is a non-invasive first-trimester screening.'
  },
  {
    id: 'guideline_4',
    title: 'Iron & Folic Acid Supplementation',
    week_range: '12-40',
    priority: 'high',
    organization: ['MoHFW', 'WHO'],
    purpose: 'Prevent anemia and neural defects',
    content: 'Take daily iron and folic acid supplements from week 12 throughout pregnancy. This prevents anemia in the mother and neural tube defects in the baby. Folic acid is especially important in early pregnancy.'
  },
  {
    id: 'guideline_5',
    title: 'Tdap Vaccine - Dose 1',
    week_range: '13-24',
    priority: 'high',
    organization: ['MoHFW'],
    purpose: 'Prevent neonatal tetanus and maternal diphtheria',
    content: 'Get your first Tdap (Tetanus, Diphtheria, Pertussis) vaccine between weeks 13-24. This protects against neonatal tetanus and provides some immunity to the newborn through placental transfer.'
  },
  {
    id: 'guideline_6',
    title: 'Anomaly Scan (TIFFA)',
    week_range: '18-22',
    priority: 'high',
    organization: ['FOGSI'],
    purpose: 'Check fetal organs and structure',
    content: 'The Targeted Imaging for Fetal Anomalies (TIFFA) scan during weeks 18-22 is a detailed ultrasound to check all fetal organs and structures. This is the most comprehensive scan during pregnancy.'
  },
  {
    id: 'guideline_7',
    title: 'Calcium Supplementation',
    week_range: '14-40',
    priority: 'medium',
    organization: ['MoHFW'],
    purpose: 'Support bone health, prevent preeclampsia',
    content: 'Calcium supplementation from week 14 onwards supports bone health for both mother and baby, and may help prevent pregnancy-related hypertension and preeclampsia.'
  },
  {
    id: 'guideline_8',
    title: 'Gestational Diabetes Screening',
    week_range: '24-28',
    priority: 'high',
    organization: ['FOGSI', 'MoHFW'],
    purpose: 'Detect gestational diabetes',
    content: 'A glucose tolerance test during weeks 24-28 screens for gestational diabetes mellitus (GDM). Early detection allows dietary management and monitoring to prevent complications.'
  },
  {
    id: 'guideline_9',
    title: 'Tdap Booster (if missed)',
    week_range: '28-32',
    priority: 'high',
    organization: ['MoHFW'],
    purpose: 'Ensure protection from neonatal tetanus',
    content: 'If the first Tdap dose was missed, get a booster between weeks 28-32. This ensures adequate protection against tetanus for both mother and newborn.'
  },
  {
    id: 'guideline_10',
    title: 'Growth Scan',
    week_range: '30-34',
    priority: 'high',
    organization: ['FOGSI'],
    purpose: 'Monitor fetal growth and amniotic fluid',
    content: 'A growth scan during weeks 30-34 monitors fetal growth, position, and amniotic fluid levels. This helps identify any growth restrictions or excess fluid that may need management.'
  },
  {
    id: 'guideline_11',
    title: 'Birth Preparedness & Counseling',
    week_range: '32-36',
    priority: 'medium',
    organization: ['MoHFW'],
    purpose: 'Discuss labor signs, delivery plan, hospital bag',
    content: 'Between weeks 32-36, discuss birth preparedness with your healthcare provider. Learn about labor signs, create a delivery plan, identify your delivery hospital, and prepare your hospital bag.'
  },
  {
    id: 'guideline_12',
    title: 'Labor Signs Education',
    week_range: '36-40',
    priority: 'high',
    organization: ['MoHFW', 'WHO'],
    purpose: 'Identify when to visit hospital',
    content: 'Learn to recognize labor signs: regular contractions, water breaking, bloody show, or reduced fetal movement. Know when to go to the hospital and have emergency contacts ready.'
  },
  {
    id: 'guideline_13',
    title: 'HIV Re-screening',
    week_range: '36-38',
    priority: 'medium',
    organization: ['NACO'],
    purpose: 'Recheck for seroconversion',
    content: 'A repeat HIV test during weeks 36-38 checks for any seroconversion that may have occurred during pregnancy. This is important for preventing mother-to-child transmission.'
  },
  {
    id: 'guideline_14',
    title: 'Fetal Movement Monitoring',
    week_range: '28-40',
    priority: 'high',
    organization: ['FOGSI', 'WHO'],
    purpose: 'Track baby movements for health assessment',
    content: 'Monitor fetal movements daily from week 28. A healthy baby typically moves 10 or more times in 2 hours. Report any significant decrease in movement to your healthcare provider immediately.'
  },
  {
    id: 'guideline_15',
    title: 'Third Trimester Blood Tests',
    week_range: '32-36',
    priority: 'medium',
    organization: ['MoHFW'],
    purpose: 'Check hemoglobin and screen for complications',
    content: 'Repeat blood tests in the third trimester to check hemoglobin levels and screen for any late-onset complications. Address any anemia before delivery.'
  },
  {
    id: 'guideline_16',
    title: 'Flu Vaccination',
    week_range: '14-40',
    priority: 'medium',
    organization: ['WHO', 'CDC'],
    purpose: 'Protect against influenza during pregnancy',
    content: 'Get the seasonal flu vaccine during pregnancy, especially if pregnant during flu season. Pregnancy increases the risk of severe flu complications. The vaccine is safe and protects the newborn too.'
  },
  {
    id: 'guideline_17',
    title: 'Dental Checkup',
    week_range: '12-24',
    priority: 'medium',
    organization: ['ADA', 'MoHFW'],
    purpose: 'Maintain oral health during pregnancy',
    content: 'Schedule a dental checkup during the second trimester. Pregnancy hormones can affect gum health. Good oral hygiene is linked to better pregnancy outcomes.'
  },
  {
    id: 'guideline_18',
    title: 'Nutrition Counseling',
    week_range: '1-40',
    priority: 'high',
    organization: ['MoHFW', 'WHO'],
    purpose: 'Ensure proper nutrition throughout pregnancy',
    content: 'Maintain a balanced diet rich in protein, calcium, iron, and vitamins. Avoid raw/undercooked foods, unpasteurized dairy, and limit caffeine. Stay hydrated with 8-10 glasses of water daily.'
  },
  {
    id: 'guideline_19',
    title: 'Physical Activity Guidelines',
    week_range: '1-40',
    priority: 'medium',
    organization: ['ACOG', 'WHO'],
    purpose: 'Stay active and healthy during pregnancy',
    content: 'Engage in 150 minutes of moderate exercise per week unless contraindicated. Walking, swimming, and prenatal yoga are excellent options. Avoid contact sports and lying flat on your back after the first trimester.'
  }
];

// Pre-computed searchable content for vector matching
export const GUIDELINES_SEARCH_INDEX = PREGNANCY_GUIDELINES.map(g => ({
  id: g.id,
  searchText: `${g.title} ${g.purpose} ${g.content} week ${g.week_range}`.toLowerCase(),
  weekStart: parseInt(g.week_range.split('-')[0]),
  weekEnd: parseInt(g.week_range.split('-')[1]),
  priority: g.priority,
}));

/**
 * Search guidelines by text query using keyword matching
 */
export function searchGuidelines(query, currentWeek = null, limit = 3) {
  if (!query) return [];
  
  const normalizedQuery = query.toLowerCase();
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);
  
  // Score each guideline
  const scored = GUIDELINES_SEARCH_INDEX.map(index => {
    let score = 0;
    
    // Word matching score
    for (const word of queryWords) {
      if (index.searchText.includes(word)) {
        score += 1;
      }
    }
    
    // Boost score if within current week range
    if (currentWeek && currentWeek >= index.weekStart && currentWeek <= index.weekEnd) {
      score += 2;
    }
    
    // Priority boost
    if (index.priority === 'high') {
      score += 0.5;
    }
    
    return { id: index.id, score };
  });
  
  // Sort by score and return top results
  const topResults = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return topResults.map(r => {
    const guideline = PREGNANCY_GUIDELINES.find(g => g.id === r.id);
    return {
      ...guideline,
      relevanceScore: r.score
    };
  });
}

/**
 * Get guidelines relevant to a specific pregnancy week
 */
export function getGuidelinesForWeek(week, limit = 5) {
  return PREGNANCY_GUIDELINES
    .filter(g => {
      const [start, end] = g.week_range.split('-').map(Number);
      return week >= start && week <= end;
    })
    .sort((a, b) => {
      // Sort by priority (high first)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    })
    .slice(0, limit);
}

/**
 * Format guidelines for prompt context
 */
export function formatGuidelinesForPrompt(guidelines) {
  if (!guidelines || guidelines.length === 0) {
    return 'No specific guidelines available for this query.';
  }
  
  return guidelines.map(g => 
    `[${g.week_range} weeks] ${g.title}: ${g.content}`
  ).join('\n\n');
}

export default {
  PREGNANCY_GUIDELINES,
  GUIDELINES_SEARCH_INDEX,
  searchGuidelines,
  getGuidelinesForWeek,
  formatGuidelinesForPrompt,
};
