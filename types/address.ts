export interface Country {
  id: number;
  name: string;
  native: string | null;
  region: string | null;
  subregion: string | null;
  iso2: string | null;
  iso3: string | null;
  phonecode: string | null;
  capital: string | null;
  currency: string | null;
  currency_symbol: string | null;
  emoji: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CountriesResponse {
  data: Country[];
  totalCount: number;
  totalPages: number;
  regions: string[];
}

export interface State {
  id: number;
  name: string;
  native: string | null;
  country_id: number | null;
  country_code: string | null;
  iso2: string | null;
  type: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface StatesResponse {
  data: State[];
  totalCount: number;
  totalPages: number;
  countries: string[];
}

export interface City {
  id: number;
  name: string;
  native: string | null;
  state_id: number | null;
  state_code: string | null;
  country_id: number | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CitiesResponse {
  data: City[];
  totalCount: number;
  totalPages: number;
  countries: string[];
  states: string[];
}
