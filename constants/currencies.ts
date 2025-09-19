import type { Currency, CurrencyInfo } from '@/types/finance';

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  UYU: {
    code: 'UYU',
    symbol: '$U',
    name: 'Peso Uruguayo',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Estadounidense',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
  },
};

// Tasas de cambio base (se actualizan diariamente)
// Estas son tasas aproximadas basadas en valores históricos de BROU
export const DEFAULT_EXCHANGE_RATES: Record<Currency, number> = {
  UYU: 1, // Base currency
  USD: 42.5, // 1 USD = 42.5 UYU (aproximado según BROU)
  EUR: 46.8, // 1 EUR = 46.8 UYU (aproximado según BROU)
};

// API para obtener tasas de cambio actualizadas desde exchangerate-api.com
export const fetchExchangeRates = async (): Promise<Record<Currency, number>> => {
  try {
    console.log('Fetching exchange rates from API...');
    
    // Usar exchangerate-api.com con UYU como base
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/UYU');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Exchange rate API response:', data);
    
    if (!data.rates) {
      throw new Error('Invalid API response format');
    }
    
    // Convertir las tasas para que UYU sea la base (1 UYU = X USD/EUR)
    // La API nos da 1 UYU = X USD, pero necesitamos 1 USD = X UYU
    const usdRate = data.rates.USD ? (1 / data.rates.USD) : DEFAULT_EXCHANGE_RATES.USD;
    const eurRate = data.rates.EUR ? (1 / data.rates.EUR) : DEFAULT_EXCHANGE_RATES.EUR;
    
    const rates = {
      UYU: 1, // Base currency always 1
      USD: Math.round(usdRate * 100) / 100,
      EUR: Math.round(eurRate * 100) / 100,
    };
    
    console.log('Processed exchange rates:', rates);
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    console.log('Using default exchange rates as fallback');
    return DEFAULT_EXCHANGE_RATES;
  }
};

export const shouldUpdateRates = (lastUpdated: string): boolean => {
  const lastUpdate = new Date(lastUpdated);
  const now = new Date();
  const diffInHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  return diffInHours >= 24; // Update every 24 hours
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  const currencyInfo = CURRENCIES[currency];
  
  // Formatear según la moneda
  switch (currency) {
    case 'UYU':
      return new Intl.NumberFormat('es-UY', {
        style: 'currency',
        currency: 'UYU',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount).replace('UYU', currencyInfo.symbol);
    
    case 'USD':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    
    case 'EUR':
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);
    
    default:
      return `${currencyInfo.symbol}${amount.toFixed(2)}`;
  }
};

export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCIES[currency]?.symbol || '$';
};

export const getCurrencyName = (currency: Currency): string => {
  return CURRENCIES[currency]?.name || currency;
};

export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: Record<Currency, number>
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Las tasas están expresadas como: 1 USD = X UYU, 1 EUR = X UYU
  // Entonces exchangeRates.USD = cuántos UYU vale 1 USD
  
  // Convertir a UYU primero (moneda base del sistema de tasas)
  let amountInUYU: number;
  if (fromCurrency === 'UYU') {
    amountInUYU = amount;
  } else {
    // Si viene de USD o EUR, multiplicar por la tasa para obtener UYU
    amountInUYU = amount * exchangeRates[fromCurrency];
  }
  
  // Convertir de UYU a la moneda destino
  if (toCurrency === 'UYU') {
    return amountInUYU;
  } else {
    // Si va a USD o EUR, dividir por la tasa para obtener la moneda destino
    return amountInUYU / exchangeRates[toCurrency];
  }
};

// Nueva función para convertir considerando la moneda base del usuario
export const convertToBaseCurrency = (
  amount: number,
  fromCurrency: Currency,
  baseCurrency: Currency,
  exchangeRates: Record<Currency, number>
): number => {
  return convertCurrency(amount, fromCurrency, baseCurrency, exchangeRates);
};

// Función para obtener la tasa de cambio entre dos monedas
export const getExchangeRate = (
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRates: Record<Currency, number>
): number => {
  if (fromCurrency === toCurrency) {
    return 1;
  }
  
  // Convertir 1 unidad de fromCurrency a toCurrency
  return convertCurrency(1, fromCurrency, toCurrency, exchangeRates);
};

export const getExchangeRateText = (
  rates: Record<Currency, number>, 
  lastUpdated: string, 
  baseCurrency: Currency = 'UYU'
): string => {
  const updateDate = new Date(lastUpdated).toLocaleDateString('es-ES');
  const baseCurrencySymbol = CURRENCIES[baseCurrency].symbol;
  
  if (baseCurrency === 'UYU') {
    return `Tasas actualizadas el ${updateDate}:\n1 USD = $U ${rates.USD}\n1 EUR = $U ${rates.EUR}`;
  } else {
    let text = `Tasas actualizadas el ${updateDate}:`;
    
    // Mostrar las tasas de las otras monedas
    const currencies: Currency[] = ['USD', 'EUR', 'UYU'];
    currencies.forEach(currency => {
      if (currency !== baseCurrency) {
        const rate = getExchangeRate(currency, baseCurrency, rates);
        text += `\n1 ${currency} = ${baseCurrencySymbol}${rate.toFixed(4)}`;
      }
    });
    
    return text;
  }
};