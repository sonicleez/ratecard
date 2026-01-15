export interface QuoteItem {
  no: number | string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteGroup {
  id: string;
  title: string;
  subtitle: string;
  items: QuoteItem[];
  subtotal: number;
}

export interface CompanyInfo {
  name: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
}

export interface Representative {
  title: string;
  name: string;
}

// Style configuration that AI can control
export interface StyleConfig {
  // Font settings
  fontFamily: string;           // Google Font name, e.g., "Roboto", "Open Sans"
  headingFont: string;          // Font for headings
  bodyFontSize: number;         // Base font size in px
  headingFontSize: number;      // Heading font size in px

  // Colors
  primaryColor: string;         // Main brand color (hex)
  secondaryColor: string;       // Secondary color (usually dark/header background)
  accentColor: string;          // Accent color (hex)
  textColor: string;            // Body text color

  // Layout & Customization
  tableStyle: 'modern' | 'classic' | 'minimal' | 'executive' | 'creative';
  layoutVariant?: 'standard' | 'sidebar' | 'compact' | 'split';
  metaGridColumns?: 2 | 4;      // Number of columns for meta info (customer, project, date, quote no)
  showLogo: boolean;
  paperSize: 'A4' | 'Letter';
  customCss?: string;           // AI can inject custom CSS for specific layout tweaks
}

export interface QuoteData {
  quoteNo: string;
  date: string;
  customerName: string;
  companyName: string;
  projectName: string;
  quoteTitle: string;
  subtitle: string;
  groups: QuoteGroup[];
  totalQuote: number;
  vat: number;
  grandTotal: number;
  notes: string[];
  bankInfo: {
    bankName: string;
    accountNo: string;
    accountName: string;
  };
  companyInfo: CompanyInfo;
  customerRep: Representative;
  companyRep: Representative;

  // Style configuration
  style?: StyleConfig;
}
