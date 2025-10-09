import { CeloService } from './CeloService';

export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber: string;
  countryCode: string;
  nationalNumber: string;
  error?: string;
}

export interface PhoneLookupResult {
  found: boolean;
  address?: string;
  name?: string;
  isVerified?: boolean;
}

class PhoneService {
  private celoService: CeloService;

  constructor() {
    this.celoService = CeloService;
  }

  /**
   * Validate and format phone number
   */
  validatePhoneNumber(phoneNumber: string): PhoneValidationResult {
    try {
      // Remove all non-digit characters except +
      const cleaned = phoneNumber.replace(/[^\d+]/g, '');
      
      // Basic validation patterns
      const patterns = {
        // International format with country code
        international: /^\+[1-9]\d{1,14}$/,
        // US format
        us: /^\+1\d{10}$/,
        // Generic format
        generic: /^\d{7,15}$/,
      };

      let formattedNumber = cleaned;
      let countryCode = '';
      let nationalNumber = '';

      if (patterns.international.test(cleaned)) {
        // Extract country code (1-3 digits after +)
        const match = cleaned.match(/^\+(\d{1,3})(\d+)$/);
        if (match) {
          countryCode = match[1];
          nationalNumber = match[2];
          formattedNumber = `+${countryCode}${nationalNumber}`;
        }
      } else if (patterns.us.test(cleaned)) {
        countryCode = '1';
        nationalNumber = cleaned.slice(2);
        formattedNumber = `+1${nationalNumber}`;
      } else if (patterns.generic.test(cleaned)) {
        // Assume it's a national number, try to determine country
        if (cleaned.length === 10) {
          // Likely US number without country code
          countryCode = '1';
          nationalNumber = cleaned;
          formattedNumber = `+1${cleaned}`;
        } else {
          // Generic international number
          nationalNumber = cleaned;
          formattedNumber = `+${cleaned}`;
        }
      } else {
        return {
          isValid: false,
          formattedNumber: phoneNumber,
          countryCode: '',
          nationalNumber: '',
          error: 'Invalid phone number format',
        };
      }

      return {
        isValid: true,
        formattedNumber,
        countryCode,
        nationalNumber,
      };
    } catch (error) {
      return {
        isValid: false,
        formattedNumber: phoneNumber,
        countryCode: '',
        nationalNumber: '',
        error: 'Error validating phone number',
      };
    }
  }

  /**
   * Look up wallet address by phone number
   */
  async lookupPhoneNumber(phoneNumber: string): Promise<PhoneLookupResult> {
    try {
      const validation = this.validatePhoneNumber(phoneNumber);
      
      if (!validation.isValid) {
        return {
          found: false,
        };
      }

      const address = await this.celoService.getAddressByPhone(validation.formattedNumber);
      
      if (address && address !== '0x0000000000000000000000000000000000000000') {
        return {
          found: true,
          address,
          // In a real implementation, you would fetch additional user data
          name: 'CeloSwift User',
          isVerified: true,
        };
      }

      return {
        found: false,
      };
    } catch (error) {
      console.error('Error looking up phone number:', error);
      return {
        found: false,
      };
    }
  }

  /**
   * Register phone number with wallet
   */
  async registerPhoneNumber(phoneNumber: string, name: string): Promise<boolean> {
    try {
      const validation = this.validatePhoneNumber(phoneNumber);
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid phone number');
      }

      const txHash = await this.celoService.registerPhone(validation.formattedNumber, name);
      
      // Wait for transaction confirmation
      const confirmed = await this.celoService.waitForTransaction(txHash);
      
      return confirmed;
    } catch (error) {
      console.error('Error registering phone number:', error);
      throw error;
    }
  }

  /**
   * Format phone number for display
   */
  formatPhoneForDisplay(phoneNumber: string): string {
    const validation = this.validatePhoneNumber(phoneNumber);
    
    if (!validation.isValid) {
      return phoneNumber;
    }

    const { countryCode, nationalNumber } = validation;

    // Format based on country code
    if (countryCode === '1') {
      // US/Canada format: +1 (XXX) XXX-XXXX
      if (nationalNumber.length === 10) {
        return `+1 (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
      }
    } else if (countryCode === '44') {
      // UK format: +44 XXXX XXX XXX
      if (nationalNumber.length >= 10) {
        return `+44 ${nationalNumber.slice(0, 4)} ${nationalNumber.slice(4, 7)} ${nationalNumber.slice(7)}`;
      }
    } else if (countryCode === '49') {
      // Germany format: +49 XXX XXXXXXX
      if (nationalNumber.length >= 10) {
        return `+49 ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3)}`;
      }
    } else if (countryCode === '33') {
      // France format: +33 X XX XX XX XX
      if (nationalNumber.length >= 9) {
        return `+33 ${nationalNumber.slice(0, 1)} ${nationalNumber.slice(1, 3)} ${nationalNumber.slice(3, 5)} ${nationalNumber.slice(5, 7)} ${nationalNumber.slice(7)}`;
      }
    }

    // Default format: +XX XXX XXX XXXX
    return `+${countryCode} ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6)}`;
  }

  /**
   * Get country name from country code
   */
  getCountryName(countryCode: string): string {
    const countryMap: { [key: string]: string } = {
      '1': 'United States/Canada',
      '44': 'United Kingdom',
      '49': 'Germany',
      '33': 'France',
      '39': 'Italy',
      '34': 'Spain',
      '31': 'Netherlands',
      '32': 'Belgium',
      '41': 'Switzerland',
      '43': 'Austria',
      '45': 'Denmark',
      '46': 'Sweden',
      '47': 'Norway',
      '48': 'Poland',
      '351': 'Portugal',
      '30': 'Greece',
      '90': 'Turkey',
      '7': 'Russia',
      '86': 'China',
      '81': 'Japan',
      '82': 'South Korea',
      '91': 'India',
      '61': 'Australia',
      '64': 'New Zealand',
      '55': 'Brazil',
      '52': 'Mexico',
      '54': 'Argentina',
      '56': 'Chile',
      '57': 'Colombia',
      '58': 'Venezuela',
      '51': 'Peru',
      '593': 'Ecuador',
      '591': 'Bolivia',
      '598': 'Uruguay',
      '595': 'Paraguay',
      '27': 'South Africa',
      '234': 'Nigeria',
      '254': 'Kenya',
      '256': 'Uganda',
      '255': 'Tanzania',
      '250': 'Rwanda',
      '251': 'Ethiopia',
      '20': 'Egypt',
      '212': 'Morocco',
      '213': 'Algeria',
      '216': 'Tunisia',
      '218': 'Libya',
    };

    return countryMap[countryCode] || `Country Code +${countryCode}`;
  }

  /**
   * Check if phone number is from a supported country
   */
  isSupportedCountry(countryCode: string): boolean {
    const supportedCountries = [
      '1', '44', '49', '33', '39', '34', '31', '32', '41', '43',
      '45', '46', '47', '48', '351', '30', '90', '7', '86', '81',
      '82', '91', '61', '64', '55', '52', '54', '56', '57', '58',
      '51', '593', '591', '598', '595', '27', '234', '254', '256',
      '255', '250', '251', '20', '212', '213', '216', '218'
    ];

    return supportedCountries.includes(countryCode);
  }

  /**
   * Generate QR code data for phone number
   */
  generatePhoneQRData(phoneNumber: string): string {
    const validation = this.validatePhoneNumber(phoneNumber);
    
    if (!validation.isValid) {
      throw new Error('Invalid phone number for QR code');
    }

    return JSON.stringify({
      type: 'phone_number',
      phone: validation.formattedNumber,
      timestamp: Date.now(),
    });
  }

  /**
   * Parse QR code data for phone number
   */
  parsePhoneQRData(qrData: string): string | null {
    try {
      const data = JSON.parse(qrData);
      
      if (data.type === 'phone_number' && data.phone) {
        const validation = this.validatePhoneNumber(data.phone);
        return validation.isValid ? validation.formattedNumber : null;
      }
      
      return null;
    } catch (error) {
      // If not JSON, try to parse as plain phone number
      const validation = this.validatePhoneNumber(qrData);
      return validation.isValid ? validation.formattedNumber : null;
    }
  }
}

export default new PhoneService();
