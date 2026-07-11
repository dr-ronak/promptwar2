// Weather Service to query Open-Meteo and run monsoon risk engine

// Local coordinate directory of major cities
export const CITIES_COORDINATES = {
  mumbai: { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra', country: 'India' },
  delhi: { name: 'Delhi', lat: 28.6139, lon: 77.2090, state: 'Delhi', country: 'India' },
  kolkata: { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal', country: 'India' },
  chennai: { name: 'Chennai', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu', country: 'India' },
  bengaluru: { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, state: 'Karnataka', country: 'India' },
  guwahati: { name: 'Guwahati', lat: 26.1445, lon: 91.7362, state: 'Assam', country: 'India' },
  pune: { name: 'Pune', lat: 18.5204, lon: 73.8567, state: 'Maharashtra', country: 'India' },
  hyderabad: { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, state: 'Telangana', country: 'India' },
  kochi: { name: 'Kochi', lat: 9.9312, lon: 76.2673, state: 'Kerala', country: 'India' },
  patna: { name: 'Patna', lat: 25.5941, lon: 85.1376, state: 'Bihar', country: 'India' },
  dhaka: { name: 'Dhaka', lat: 23.8103, lon: 90.4125, state: 'Dhaka', country: 'Bangladesh' },
  kathmandu: { name: 'Kathmandu', lat: 27.7172, lon: 85.3240, state: 'Bagmati', country: 'Nepal' },
  colombo: { name: 'Colombo', lat: 6.9271, lon: 79.8612, state: 'Western', country: 'Sri Lanka' }
};

export const weatherService = {
  // Finds city coordinates or returns a default/simulated coordinate for custom queries
  resolveCity(cityName) {
    const key = cityName.toLowerCase().trim();
    if (CITIES_COORDINATES[key]) {
      return CITIES_COORDINATES[key];
    }
    
    // Simulate coordinates for random cities using a basic hash
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const lat = 8.0 + Math.abs((hash % 250) / 10.0); // Keep in Indian subcontinent latitude bands (8 to 33 N)
    const lon = 68.0 + Math.abs(((hash >> 8) % 250) / 10.0); // Longitude bands (68 to 93 E)
    
    return {
      name: cityName.charAt(0).toUpperCase() + cityName.slice(1),
      lat: parseFloat(lat.toFixed(4)),
      lon: parseFloat(lon.toFixed(4)),
      state: 'Unknown Region',
      country: 'Detected Location'
    };
  },

  async fetchWeather(cityName) {
    const city = this.resolveCity(cityName);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=precipitation_sum,precipitation_probability_max&timezone=auto`
      );
      
      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      return this.processWeatherData(city, data);
    } catch (error) {
      console.warn('Weather fetch failed, falling back to simulated data:', error);
      return this.generateSimulatedMonsoonWeather(city);
    }
  },

  processWeatherData(city, apiData) {
    const current = apiData.current;
    const daily = apiData.daily;

    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const rain = current.rain || current.precipitation || 0; // mm in last hour
    const wind = current.wind_speed_10m; // km/h
    
    // Total daily estimated precipitation
    const dailyRainSum = daily && daily.precipitation_sum ? daily.precipitation_sum[0] : (rain * 8); // fallback estimate
    const rainProb = daily && daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : (rain > 0 ? 95 : 45);

    // Run risk engine based on parameters
    const floodRiskIndex = Math.min(10, Math.max(0, parseFloat(((dailyRainSum / 12) + (rain * 1.5)).toFixed(1))));
    
    let waterloggingRisk = 'Low';
    if (floodRiskIndex > 6 || rain > 15) {
      waterloggingRisk = 'High';
    } else if (floodRiskIndex > 3 || rain > 5) {
      waterloggingRisk = 'Medium';
    }

    const lightningProbability = Math.min(100, Math.max(0, Math.round((humidity > 80 && temp > 28) ? 80 : (humidity > 60 ? (humidity - 20) : 10))));

    // Determine alerts
    const alerts = [];
    if (rain > 10 || dailyRainSum > 50) {
      alerts.push('HEAVY_RAIN');
    }
    if (lightningProbability > 70 && rain > 2) {
      alerts.push('LIGHTNING');
    }
    if (wind > 35) {
      alerts.push('HIGH_WIND');
    }
    if (waterloggingRisk === 'High') {
      alerts.push('WATERLOGGING');
    }

    // Standard waterlogging hotspots based on city name for immersive citizen feel
    const hotspots = this.getWaterloggingHotspots(city.name);

    return {
      city: city.name,
      state: city.state,
      country: city.country,
      coordinates: { lat: city.lat, lon: city.lon },
      temp,
      humidity,
      rain,
      wind,
      dailyRainSum,
      rainProb,
      floodRiskIndex,
      waterloggingRisk,
      lightningProbability,
      alerts,
      hotspots,
      timestamp: new Date().toISOString()
    };
  },

  // Generates high fidelity simulated monsoon weather for demo/offline purposes
  generateSimulatedMonsoonWeather(city) {
    // Generate deterministic values based on city name string hash
    let hash = 0;
    for (let i = 0; i < city.name.length; i++) {
      hash = city.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Most cities in monsoon are humid (75-98%) and warm (24-32C)
    const temp = 24 + Math.abs(hash % 9); // 24 to 32
    const humidity = 75 + Math.abs((hash >> 4) % 24); // 75 to 98
    
    // Simulate rainfall intensity based on hash: some dry, some moderate, some heavy
    const monsoonFactor = Math.abs((hash >> 8) % 10);
    let rain = 0; // mm in last hour
    let dailyRainSum = 0;
    
    if (monsoonFactor > 7) {
      rain = 18.5; // Heavy rain storm
      dailyRainSum = 94.2;
    } else if (monsoonFactor > 4) {
      rain = 4.2; // Light/Moderate shower
      dailyRainSum = 22.8;
    } else {
      rain = 0.2; // Drizzle
      dailyRainSum = 3.5;
    }

    const wind = 15 + Math.abs((hash >> 12) % 35); // 15 to 50 km/h
    const rainProb = rain > 0 ? 98 : 60;

    const floodRiskIndex = Math.min(10, Math.max(0, parseFloat(((dailyRainSum / 12) + (rain * 1.5)).toFixed(1))));
    let waterloggingRisk = 'Low';
    if (floodRiskIndex > 6 || rain > 15) {
      waterloggingRisk = 'High';
    } else if (floodRiskIndex > 3 || rain > 5) {
      waterloggingRisk = 'Medium';
    }

    const lightningProbability = Math.min(100, Math.max(0, Math.round(monsoonFactor > 6 ? 85 : 30)));

    const alerts = [];
    if (rain > 10 || dailyRainSum > 50) {
      alerts.push('HEAVY_RAIN');
    }
    if (lightningProbability > 70 && rain > 2) {
      alerts.push('LIGHTNING');
    }
    if (wind > 35) {
      alerts.push('HIGH_WIND');
    }
    if (waterloggingRisk === 'High') {
      alerts.push('WATERLOGGING');
    }

    const hotspots = this.getWaterloggingHotspots(city.name);

    return {
      city: city.name,
      state: city.state,
      country: city.country,
      coordinates: { lat: city.lat, lon: city.lon },
      temp,
      humidity,
      rain,
      wind,
      dailyRainSum,
      rainProb,
      floodRiskIndex,
      waterloggingRisk,
      lightningProbability,
      alerts,
      hotspots,
      timestamp: new Date().toISOString(),
      isSimulated: true
    };
  },

  getWaterloggingHotspots(cityName) {
    const list = {
      'Mumbai': ['Hindmata Junction', 'Milan Subway', 'Kurla Depot area', 'Andheri Subway', 'King Circle'],
      'Delhi': ['Minto Bridge underpass', 'Pul Prahladpur underpass', 'Dwarka Sector 8', 'Ring Road near WHO building'],
      'Kolkata': ['Thanthania Kalibari', 'Amherst Street', 'Central Avenue', 'Ultadanga underpass'],
      'Chennai': ['Velachery main road', 'G.N. Chetty Road', 'Kathipara Junction underpass', 'Mudichur residential area'],
      'Bengaluru': ['Silk Board Junction underpass', 'Outer Ring Road (Bellandur)', 'Hebbal Flyover loops', 'Koramangala 4th block'],
      'Guwahati': ['Rukminigaon G.S. Road', 'Anil Nagar', 'Nabin Nagar', 'Zoo Road']
    };

    return list[cityName] || ['Low-lying market underpasses', 'Main highway junctions with drainage construction', 'Railway station approach roads'];
  }
};
