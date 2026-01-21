// Configuration loader service
import sourcesConfig from '../../config/sources.json';
import thresholdsConfig from '../../config/thresholds.json';
import sp500Config from '../../config/sp500.json';
import privateMajorConfig from '../../config/private_major.json';
import type { 
  SourcesConfig, 
  CategoryThresholds, 
  ScoringWeights, 
  ScoringPenalties,
  Company,
  Category 
} from '@/types';

// Sources configuration
export function getSources(): SourcesConfig {
  return sourcesConfig as SourcesConfig;
}

export function getSourcesForCategory(category: Category) {
  const sources = getSources();
  return sources[category];
}

// Thresholds configuration
export function getGlobalThresholds() {
  return thresholdsConfig.global;
}

export function getCategoryThresholds(category: Category): CategoryThresholds {
  const categoryKey = category.toLowerCase().replace('_', '-');
  return thresholdsConfig.categories[category as keyof typeof thresholdsConfig.categories] || 
    thresholdsConfig.categories.technology;
}

export function getScoringWeights(): ScoringWeights {
  return thresholdsConfig.scoring.weights;
}

export function getScoringPenalties(): ScoringPenalties {
  return thresholdsConfig.scoring.penalties;
}

export function getWiggumLoopConfig() {
  return thresholdsConfig.wiggumLoop;
}

export function getCalmSummaryConfig() {
  return thresholdsConfig.calmSummary;
}

// Company lists for business filtering
export function getCompanyList(): Company[] {
  const sp500Companies = sp500Config.companies as Company[];
  const privateCompanies = privateMajorConfig.companies as Company[];
  return [...sp500Companies, ...privateCompanies];
}

export function getCompanyNames(): Set<string> {
  const companies = getCompanyList();
  const names = new Set<string>();
  
  for (const company of companies) {
    names.add(company.name.toLowerCase());
    if (company.symbol) {
      names.add(company.symbol.toLowerCase());
    }
    for (const alias of company.aliases) {
      names.add(alias.toLowerCase());
    }
  }
  
  return names;
}

// Check if text mentions a major company
export function mentionsMajorCompany(text: string): boolean {
  const companyNames = getCompanyNames();
  const lowerText = text.toLowerCase();
  
  for (const name of companyNames) {
    // Use word boundary matching to avoid false positives
    const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');
    if (regex.test(lowerText)) {
      return true;
    }
  }
  
  return false;
}

// Find which companies are mentioned
export function findMentionedCompanies(text: string): Company[] {
  const companies = getCompanyList();
  const lowerText = text.toLowerCase();
  const mentioned: Company[] = [];
  
  for (const company of companies) {
    const namesToCheck = [company.name, ...(company.symbol ? [company.symbol] : []), ...company.aliases];
    
    for (const name of namesToCheck) {
      const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');
      if (regex.test(lowerText)) {
        mentioned.push(company);
        break;
      }
    }
  }
  
  return mentioned;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Category display names
export const CATEGORY_DISPLAY_NAMES: Record<Category, string> = {
  technology: 'Technology',
  crypto: 'Crypto',
  ai: 'AI',
  business: 'Business',
  market_movements: 'Market Movements'
};

export const ALL_CATEGORIES: Category[] = [
  'technology',
  'crypto',
  'ai',
  'business',
  'market_movements'
];
