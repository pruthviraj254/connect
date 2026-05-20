export type ThemeId =
  | 'trust-blue'
  | 'nature-green'
  | 'care-violet'
  | 'vital-orange'
  | 'modern-slate'
  | 'fresh-teal'
  | 'classic-red';

export type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

export type PharmacyService = {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  imageUrl?: string;
};

export type TeamMember = {
  name: string;
  role: string;
  bio?: string;
  photoUrl?: string;
};

export type Testimonial = {
  quote: string;
  author: string;
  enabled: boolean;
};

export type PharmacyWebsiteData = {
  pharmacyId: string;
  theme: ThemeId;

  name: string;
  tagline: string;
  heroHeadline?: string;
  heroSubtext?: string;
  heroImages?: string[];
  logoUrl?: string;
  footerLogoUrl?: string;
  aboutText?: string;
  locationNote?: string;
  metaDescription?: string;
  establishedYear?: string;
  galleryImages?: string[];

  primaryColor: string;
  accentColor: string;

  phone: string;
  fax?: string;
  email: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;

  hours: Record<string, DayHours>;

  services: PharmacyService[];
  team: TeamMember[];
  testimonials: Testimonial[];

  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };

  pharmacyLicense?: string;
  pharmacistLicense?: string;
  pharmacyLicensePdfUrl?: string;
  patientConcernsUrl?: string;

  googleMapsEmbedUrl?: string;
  bookingEmbedUrl?: string;

  subdomain?: string;
  customDomain?: string;
  publishedUrl?: string;
  lastPublishedAt?: string;
};

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  mood: string;
  bestFor: string;
};

export const THEMES: ThemeConfig[] = [
  {
    id: 'trust-blue',
    name: 'Trust Blue',
    description: 'Clinical and professional',
    primaryColor: '#1a73e8',
    accentColor: '#0d47a1',
    mood: 'Professional',
    bestFor: 'Clinical pharmacies',
  },
  {
    id: 'nature-green',
    name: 'Nature Green',
    description: 'Wellness-forward and earthy',
    primaryColor: '#2e7d32',
    accentColor: '#1b5e20',
    mood: 'Calming',
    bestFor: 'Holistic pharmacies',
  },
  {
    id: 'care-violet',
    name: 'Care Violet',
    description: 'Warm, caring and modern',
    primaryColor: '#7b1fa2',
    accentColor: '#4a148c',
    mood: 'Caring',
    bestFor: "Women's health",
  },
  {
    id: 'vital-orange',
    name: 'Vital Orange',
    description: 'Bold and approachable',
    primaryColor: '#e65100',
    accentColor: '#bf360c',
    mood: 'Energetic',
    bestFor: 'Community pharmacies',
  },
  {
    id: 'modern-slate',
    name: 'Modern Slate',
    description: 'Minimal and premium',
    primaryColor: '#37474f',
    accentColor: '#263238',
    mood: 'Premium',
    bestFor: 'Urban pharmacies',
  },
  {
    id: 'fresh-teal',
    name: 'Fresh Teal',
    description: 'Clean, fresh and airy',
    primaryColor: '#0097a7',
    accentColor: '#006064',
    mood: 'Fresh',
    bestFor: 'New pharmacies',
  },
  {
    id: 'classic-red',
    name: 'Classic Red',
    description: 'Traditional pharmacy heritage',
    primaryColor: '#c62828',
    accentColor: '#b71c1c',
    mood: 'Traditional',
    bestFor: 'Legacy pharmacies',
  },
];

export type WebBuilderBuildResult = {
  success: boolean;
  outputPath: string;
  buildLog: string;
};

export type WebBuilderPreviewResult = {
  url: string;
  port: number;
};

export type WebBuilderPublishResult = {
  liveUrl: string;
  deploymentUrl?: string;
  customDomainStatus?: string;
  dnsInstructions?: string;
};

export const DEFAULT_SERVICES: PharmacyService[] = [
  { icon: '💉', title: 'Vaccines', description: 'Flu, COVID-19, and routine immunizations.', enabled: true },
  { icon: '🧪', title: 'COVID-19 Rapid Testing', description: 'Quick results when you need them.', enabled: true },
  { icon: '✈️', title: 'Travel Vaccine Consultation', description: 'Personalized travel health advice.', enabled: true },
  { icon: '🩺', title: 'Strep Test', description: 'On-site testing with pharmacist guidance.', enabled: true },
  { icon: '💊', title: 'Automated Refills', description: 'Easy renewals and refill reminders.', enabled: true },
  { icon: '📋', title: 'Medication Reviews', description: 'Detailed one-on-one medication consultations.', enabled: true },
  { icon: '💬', title: 'One-on-one Consultations', description: 'Private time with your pharmacist.', enabled: true },
  { icon: '📦', title: 'Prescription Delivery', description: 'Convenient delivery to your door.', enabled: false },
];

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Outstanding service! The pharmacist took time to explain everything clearly. We felt truly cared for.',
    author: 'Sarah M.',
    enabled: true,
  },
  {
    quote: 'Professional, friendly staff. Appointments run on time and the pharmacy is always spotless.',
    author: 'James L.',
    enabled: true,
  },
  {
    quote: 'Our family pharmacy — knowledgeable team and convenient hours. Highly recommend.',
    author: 'Priya K.',
    enabled: true,
  },
];

export const DEFAULT_HOURS: Record<string, DayHours> = {
  monday: { open: '9:00 AM', close: '7:00 PM', closed: false },
  tuesday: { open: '9:00 AM', close: '7:00 PM', closed: false },
  wednesday: { open: '9:00 AM', close: '7:00 PM', closed: false },
  thursday: { open: '9:00 AM', close: '7:00 PM', closed: false },
  friday: { open: '9:00 AM', close: '7:00 PM', closed: false },
  saturday: { open: '10:00 AM', close: '2:00 PM', closed: false },
  sunday: { open: '', close: '', closed: true },
};
