const weatherCodes = {
  0: {
    text: "Clear Sky",
    dayIcon: "☀️",
    nightIcon: "🌙",
    severity: "normal"
  },

  1: {
    text: "Mainly Clear",
    dayIcon: "🌤️",
    nightIcon: "🌙",
    severity: "normal"
  },

  2: {
    text: "Partly Cloudy",
    dayIcon: "⛅",
    nightIcon: "☁️",
    severity: "normal"
  },

  3: {
    text: "Overcast",
    dayIcon: "☁️",
    nightIcon: "☁️",
    severity: "normal"
  },

  45: {
    text: "Fog",
    dayIcon: "🌫️",
    nightIcon: "🌫️",
    severity: "caution"
  },

  48: {
    text: "Depositing Rime Fog",
    dayIcon: "🌫️",
    nightIcon: "🌫️",
    severity: "poor"
  },

  51: {
    text: "Light Drizzle",
    dayIcon: "🌦️",
    nightIcon: "🌧️",
    severity: "normal"
  },

  53: {
    text: "Moderate Drizzle",
    dayIcon: "🌦️",
    nightIcon: "🌧️",
    severity: "caution"
  },

  55: {
    text: "Dense Drizzle",
    dayIcon: "🌧️",
    nightIcon: "🌧️",
    severity: "caution"
  },

  56: {
    text: "Light Freezing Drizzle",
    dayIcon: "🌧️❄️",
    nightIcon: "🌧️❄️",
    severity: "poor"
  },

  57: {
    text: "Dense Freezing Drizzle",
    dayIcon: "🌧️❄️",
    nightIcon: "🌧️❄️",
    severity: "severe"
  },

  61: {
    text: "Slight Rain",
    dayIcon: "🌧️",
    nightIcon: "🌧️",
    severity: "normal"
  },

  63: {
    text: "Moderate Rain",
    dayIcon: "🌧️",
    nightIcon: "🌧️",
    severity: "caution"
  },

  65: {
    text: "Heavy Rain",
    dayIcon: "🌧️",
    nightIcon: "🌧️",
    severity: "poor"
  },

  66: {
    text: "Light Freezing Rain",
    dayIcon: "🌧️❄️",
    nightIcon: "🌧️❄️",
    severity: "poor"
  },

  67: {
    text: "Heavy Freezing Rain",
    dayIcon: "🌧️❄️",
    nightIcon: "🌧️❄️",
    severity: "severe"
  },

  71: {
    text: "Slight Snowfall",
    dayIcon: "🌨️",
    nightIcon: "🌨️",
    severity: "caution"
  },

  73: {
    text: "Moderate Snowfall",
    dayIcon: "🌨️",
    nightIcon: "🌨️",
    severity: "poor"
  },

  75: {
    text: "Heavy Snowfall",
    dayIcon: "❄️",
    nightIcon: "❄️",
    severity: "severe"
  },

  77: {
    text: "Snow Grains",
    dayIcon: "🌨️",
    nightIcon: "🌨️",
    severity: "caution"
  },

  80: {
    text: "Slight Rain Showers",
    dayIcon: "🌦️",
    nightIcon: "🌧️",
    severity: "normal"
  },

  81: {
    text: "Moderate Rain Showers",
    dayIcon: "🌧️",
    nightIcon: "🌧️",
    severity: "caution"
  },

  82: {
    text: "Violent Rain Showers",
    dayIcon: "⛈️",
    nightIcon: "⛈️",
    severity: "severe"
  },

  85: {
    text: "Slight Snow Showers",
    dayIcon: "🌨️",
    nightIcon: "🌨️",
    severity: "caution"
  },

  86: {
    text: "Heavy Snow Showers",
    dayIcon: "❄️",
    nightIcon: "❄️",
    severity: "severe"
  },

  95: {
    text: "Thunderstorm",
    dayIcon: "⛈️",
    nightIcon: "⛈️",
    severity: "poor"
  },

  96: {
    text: "Thunderstorm with Slight Hail",
    dayIcon: "⛈️",
    nightIcon: "⛈️",
    severity: "severe"
  },

  99: {
    text: "Thunderstorm with Heavy Hail",
    dayIcon: "⛈️",
    nightIcon: "⛈️",
    severity: "severe"
  }
};

export default weatherCodes;