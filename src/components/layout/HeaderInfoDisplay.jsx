import React, { useEffect, useState } from 'react';
import { Thermometer } from 'lucide-react';

const HeaderInfoDisplay = ({ darkText = false }) => {
  const [date, setDate] = useState(new Date());
  const [weather, setWeather] = useState({ temp: '--', code: 0 });

  useEffect(() => {
    const timer = window.setInterval(() => setDate(new Date()), 1000);

    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=36.8065&longitude=10.1815&current_weather=true'
        );
        const data = await res.json();
        if (data.current_weather) {
          setWeather({
            temp: data.current_weather.temperature,
            code: data.current_weather.weathercode,
          });
        }
      } catch (error) {
        console.log('Weather fetch failed', error);
      }
    };

    fetchWeather();
    const weatherTimer = window.setInterval(fetchWeather, 600000);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(weatherTimer);
    };
  }, []);

  const textColor = darkText ? 'text-slate-800' : 'text-white';
  const subTextColor = darkText ? 'text-slate-500' : 'text-white/80';

  return (
    <div className={`flex items-center gap-3 sm:gap-8 ${textColor}`}>
      <div className="flex flex-col items-end">
        <div className="text-xl sm:text-3xl font-black leading-none flex items-center gap-1.5 sm:gap-2">
          {weather.temp}°{' '}
          <Thermometer size={16} className="text-orange-500 sm:w-5 sm:h-5" />
        </div>
        <div
          className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-widest ${subTextColor}`}
        >
          Tunis
        </div>
      </div>
      <div
        className={`h-8 sm:h-10 w-px ${
          darkText ? 'bg-slate-300' : 'bg-white/30'
        }`}
      />
      <div className="flex flex-col items-end">
        <div className="text-xl sm:text-3xl font-black leading-none">
          {date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        <div
          className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-widest ${subTextColor}`}
        >
          {date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
          })}
        </div>
      </div>
    </div>
  );
};

export default HeaderInfoDisplay;
