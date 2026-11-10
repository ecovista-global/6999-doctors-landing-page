export interface ClinicalBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedDate: string;
  author: string;
  tags: string[];
}

export const CLINICAL_BLOG_POSTS: ClinicalBlogPost[] = [
  {
    slug: 'managing-type-2-diabetes-in-summer',
    title: 'Managing Type 2 Diabetes in Summer: Hydration, Insulin Storage & Blood Glucose Stability',
    excerpt: 'High summer temperatures can induce dehydration, alter subcutaneous insulin absorption, and lead to sudden glycemic spikes. Learn practical clinical precautions.',
    category: 'Diabetes & Endocrinology',
    readTime: '4 min read',
    publishedDate: 'June 18, 2026',
    author: 'Dr. Maanvita Kumari (MBBS, MD)',
    tags: ['Diabetes', 'Hydration', 'Insulin Safety', 'Metabolic Health'],
  },
  {
    slug: 'monsoon-dengue-prevention-platelet-care',
    title: 'Monsoon Dengue Advisory: Critical Warning Signs, Platelet Monitoring & Safe Recovery',
    excerpt: 'Understanding NS1 antigen timing, fever patterns, fluid therapy guidelines, and identifying dangerous warning signs that require immediate hospital admission.',
    category: 'Infectious Diseases',
    readTime: '6 min read',
    publishedDate: 'July 04, 2026',
    author: 'Dr. Maanvita Kumari (MBBS, MD)',
    tags: ['Dengue', 'Fevers', 'Infections', 'Platelets'],
  },
  {
    slug: 'hypertension-salt-guidelines-indian-diet',
    title: 'Hypertension Management: Practical Low-Sodium Dietary Adjustments in Indian Cooking',
    excerpt: 'Evidence-based strategies to reduce sodium intake from concealed sources like pickles, papads, and namkeens while maintaining traditional flavors and potassium balance.',
    category: 'Cardiovascular Health',
    readTime: '5 min read',
    publishedDate: 'August 12, 2026',
    author: 'Dr. Maanvita Kumari (MBBS, MD)',
    tags: ['Hypertension', 'Dietary Health', 'Heart Care'],
  },
  {
    slug: 'thyroid-fatigue-symptoms-in-women',
    title: 'Subtle Symptoms of Hypothyroidism: Chronic Fatigue, Cold Sensitivity & TSH Testing',
    excerpt: 'Why unexplained weight gain and morning fatigue often stem from subclinical thyroid dysfunction, and how modern TSH and Anti-TPO testing guides gentle management.',
    category: 'Endocrinology & Women Health',
    readTime: '5 min read',
    publishedDate: 'September 02, 2026',
    author: 'Dr. Maanvita Kumari (MBBS, MD)',
    tags: ['Thyroid', 'Hypothyroidism', 'Women Health'],
  },
];

export const POST_CONTENTS: Record<string, { body: string[]; keyTakeaways: string[] }> = {
  'managing-type-2-diabetes-in-summer': {
    keyTakeaways: [
      'Hot weather accelerates insulin degradation if vials or cartridges exceed 25°C - always store opened insulin in an insulated pouch.',
      'Dehydration falsely elevates blood glucose concentrations by reducing total blood volume.',
      'Test capillary blood glucose twice as often during heat waves, particularly 2 hours post-meals.',
      'Avoid high-sugar summer coolers, sodas, and packaged juices; hydrate with water, fresh lemon water with rock salt, or unsweetened buttermilk.',
    ],
    body: [
      'Managing Type 2 diabetes during harsh summer months in Northern India presents specific physiological challenges that are often overlooked in standard patient guidance. As ambient temperatures exceed 38°C to 42°C, peripheral blood vessels dilate to release heat, which can paradoxically increase the absorption speed of injected subcutaneous insulin while simultaneously triggering dehydration.',
      'Dehydration is the most common hidden trigger of acute summer hyperglycemia. When fluid intake fails to keep pace with perspiration, the concentration of glucose in the bloodstream increases simply because blood volume is contracted. This often leads patients to mistakenly assume their baseline oral medication has lost efficacy, prompting unguided dose escalation that risks nocturnal hypoglycemia once rehydration occurs.',
      'Furthermore, patients using subcutaneous insulin must exercise strict temperature precautions. Insulin proteins begin denaturation when exposed to direct sunlight or temperatures above 25°C to 30°C. Never leave insulin pens inside car glove compartments or window sills. During daily commuting, transport your supplies inside an insulated cooling pouch with cold packs separated by a clean cotton cloth to avoid freezing.',
      'Nutritional adjustments during the hot season must balance electrolyte replenishment without introducing high glycemic loads. While seasonal fruits like mangoes and watermelons are abundant, their rapid glycemic absorption requires portion rationing and pairing with protein or dietary fiber like chia seeds. Drink at least 2.5 to 3 liters of plain water throughout the day, complemented by salted lemon water or homemade mint buttermilk.',
      'If you experience persistent blood sugar readings above 250 mg/dL accompanied by nausea, persistent thirst, or dizziness, visit HealthConsult Family Clinic immediately for rapid point-of-care venous evaluation and clinical adjustment.',
    ],
  },
  'monsoon-dengue-prevention-platelet-care': {
    keyTakeaways: [
      'The critical phase of dengue fever begins around Day 4 or 5 as fever subsides; this is when plasma leakage typically develops.',
      'Platelet count alone is NOT the sole severity metric; hematocrit (PCV) is equally crucial to monitor for plasma leakage.',
      'Never take ibuprofen, diclofenac, or aspirin during an undiagnosed acute fever, as NSAIDs drastically heighten internal bleeding risks.',
      'Paracetamol (under clinical guidance) combined with frequent Oral Rehydration Salts (ORS) remains the gold standard outpatient protocol.',
    ],
    body: [
      'Every monsoon season in the National Capital Region, dengue fever cases surge. Effective management hinges on timely laboratory diagnosis, adequate oral fluid resuscitation, and acute awareness of clinical warning signs that distinguish uncomplicated dengue fever from severe plasma leakage syndrome.',
      'Dengue fever typically follows three phases: the febrile phase (Days 1 to 4), characterized by high-grade fever, retro-orbital eye pain, and severe myalgia; the critical phase (Days 4 to 7), when fever subsides but capillary permeability may cause plasma leakage; and the recovery phase (Days 7 onwards). Most complications paradoxically develop precisely when the patient and family assume recovery has begun because the temperature drops.',
      'One of the most persistent misconceptions among patients is panic over declining platelet counts. While platelet counts must be tracked via serial complete blood counts (CBC), hematocrit or Packed Cell Volume (PCV) is the true barometer of vascular stability. A rising hematocrit indicates hemoconcentration and fluid loss from blood vessels into body cavities, necessitating intravenous fluid administration.',
      'Under no circumstances should patients consume non-steroidal anti-inflammatory drugs (NSAIDs) such as ibuprofen, aceclofenac, or mefenamic acid during fever episodes. These agents damage platelet function and irritate gastric mucosa, multiplying the risk of internal bleeding. Paracetamol at standard weight-appropriate dosages is the only recommended antipyretic.',
      'Consult HealthConsult Family Clinic or your nearest tertiary center immediately if you notice red flag indicators: persistent abdominal pain, recurrent vomiting, mucosal bleeding from gums or nose, severe lethargy, or breathlessness.',
    ],
  },
  'hypertension-salt-guidelines-indian-diet': {
    keyTakeaways: [
      'Aim for less than 5 grams of total salt (approximately one level teaspoon) per day across all meals.',
      'Concealed sodium in pickles, processed papads, bakery breads, and namkeens accounts for nearly 40% of adult daily sodium overload.',
      'Enhance culinary flavor using lemon juice, amchur (dry mango powder), roasted cumin, ginger, and fresh herbs instead of additional table salt.',
      'Regular ambulatory blood pressure checks at the clinic ensure timely calibration of antihypertensive regimens.',
    ],
    body: [
      'Essential hypertension affects more than 30% of urban Indian adults. While pharmaceutical therapy plays a pivotal role in preventing ischemic stroke, myocardial infarction, and chronic kidney disease, lifestyle sodium restriction remains an indispensable clinical foundation.',
      'World Health Organization (WHO) and ICMR guidelines recommend daily sodium intake of less than 2,000 mg, equivalent to approximately 5 grams of common table salt per day. In typical urban Indian diets, however, average intake exceeds 10 to 12 grams daily.',
      'The primary challenge is that majority of excess sodium is consumed through concealed traditional and commercial food products rather than direct salt added to home-cooked dal and sabzi. Traditional mango and lime pickles, preserved chutneys, store-bought namkeens, papads, instant noodles, and bakery breads contain excessive sodium benzoate and bicarbonate compounds.',
      'To reduce sodium without diminishing dining pleasure, incorporate sour and pungent spices such as freshly squeezed lemon juice, pomegranate seed powder (anardana), tamarind, crushed garlic, and ginger. These compounds naturally stimulate taste receptors, mitigating the perceived lack of saltiness.',
      'Monitor your blood pressure at the same time daily, record readings in a physical or digital log, and bring the log to your scheduled consultations with Dr. Maanvita Kumari for precise, personalized management.',
    ],
  },
  'thyroid-fatigue-symptoms-in-women': {
    keyTakeaways: [
      'Subclinical hypothyroidism frequently manifests as unexplained morning exhaustion, dry skin, constipation, and hair thinning.',
      'Serum TSH (Thyroid Stimulating Hormone) accompanied by Free T4 and Anti-TPO antibodies is the definitive diagnostic panel.',
      'Levothyroxine must be taken on an empty stomach with plain water at least 45 to 60 minutes before morning tea, coffee, or breakfast.',
      'Never discontinue or alter thyroid hormone dosage without repeat laboratory assessment and physician review.',
    ],
    body: [
      'Thyroid dysfunction, particularly primary hypothyroidism and Hashimoto thyroiditis, is extraordinarily prevalent among adult women in India. Because early symptoms develop gradually over months or years, they are frequently misattributed to general aging, workplace stress, or post-pregnancy fatigue.',
      'The thyroid gland produces thyroxine (T4) and triiodothyronine (T3), hormones that govern the basal metabolic rate of every organ system. When hormone output declines, bodily processes decelerate. Patients commonly report persistent lethargy despite 8 hours of sleep, extreme intolerance to cold environments, sudden weight gain despite normal appetite, facial puffiness, brittle nails, and irregular menstrual cycles.',
      'Accurate diagnosis requires an early morning venous blood test assessing Thyroid Stimulating Hormone (TSH) and Free T4. In patients with borderline TSH elevations (5.0 to 10.0 mIU/L), evaluating Anti-Thyroid Peroxidase (Anti-TPO) antibodies confirms whether an autoimmune etiology is driving the condition.',
      'Synthetic levothyroxine replacement therapy is safe, highly effective, and mimics the natural hormone identically. However, precise absorption requires compliance with administration rules: take your prescribed tablet first thing in the morning with a full glass of water, and wait at least 45 minutes before consuming morning milk, tea, coffee, or calcium/iron supplements.',
      'At HealthConsult Family Clinic, we customize thyroid replacement dosages based on body weight, age, and cardiac status, repeating TSH monitoring at 6 to 8 week intervals until therapeutic equilibrium is established.',
    ],
  },
};

