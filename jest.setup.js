// Mock react-native-localize
jest.mock('react-native-localize', () => ({
  findBestLanguageTag: jest.fn(() => ({
    languageTag: 'en',
    isRTL: false,
  })),
  getLocales: jest.fn(() => [
    { countryCode: 'US', languageTag: 'en-US', languageCode: 'en', isRTL: false },
  ]),
  getNumberFormatSettings: jest.fn(() => ({
    decimalSeparator: '.',
    groupingSeparator: ',',
  })),
  getCalendar: jest.fn(() => 'gregorian'),
  getCountry: jest.fn(() => 'US'),
  getCurrencies: jest.fn(() => ['USD']),
  getTemperatureUnit: jest.fn(() => 'celsius'),
  getTimeZone: jest.fn(() => 'UTC'),
  uses24HourClock: jest.fn(() => true),
  usesMetricSystem: jest.fn(() => true),
  usesAutoDateAndTime: jest.fn(() => true),
  usesAutoTimeZone: jest.fn(() => true),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));
