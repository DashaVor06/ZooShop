import { EXPO_PUBLIC_OPENWEATHER_API_KEY } from '@env';
import { getWeatherCache, saveWeatherCache } from '../../model/weatherModel';

export const weatherService = (db, isConnected) => {
  const fetchWeather = async (city = "Minsk") => {
    try {
      if (isConnected) {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${EXPO_PUBLIC_OPENWEATHER_API_KEY}&lang=ru`
        );
        const data = await response.json();
        
        if (data.cod !== 200) throw new Error(data.message);

        const weatherData = {
          temp: data.main.temp,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          city: data.name
        };

        await saveWeatherCache(db, weatherData);
        return weatherData;
      } else {
        const cached = await getWeatherCache(db);
        return cached || null;
      }
    } catch (error) {
      console.error("Weather error:", error);
      return await getWeatherCache(db);
    }
  };

  return { fetchWeather };
};