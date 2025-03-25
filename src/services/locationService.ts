
interface LocationData {
  city?: string;
  country?: string;
  region?: string;
  ip?: string;
}

export const getUserLocation = async (): Promise<LocationData> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }
    
    const data = await response.json();
    return {
      city: data.city,
      country: data.country_name,
      region: data.region,
      ip: data.ip
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {};
  }
};
