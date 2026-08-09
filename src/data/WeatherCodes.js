const weatherCodes = {
  0: {
    text: "Clear Sky",
    icon: "☀️",
    severity: "normal"
  },

  1: {
    text: "Mainly Clear",
    icon: "🌤️",
    severity: "normal"
  },

  2: {
    text: "Partly Cloudy",
    icon: "⛅",
    severity: "normal"
  },

  3: {
    text: "Overcast",
    icon: "☁️",
    severity: "normal"
  },

  45: {
    text: "Fog",
    icon: "🌫️",
    severity: "caution"
  },

  48: {
    text: "Depositing Rime Fog",
    icon: "🌫️",
    severity: "poor"
  },

  51: {
    text: "Light Drizzle",
    icon: "🌦️",
    severity: "normal"
  },

  53: {
    text: "Moderate Drizzle",
    icon: "🌦️",
    severity: "caution"
  },

  55: {
    text: "Dense Drizzle",
    icon: "🌧️",
    severity: "caution"
  },

  56: {
    text: "Light Freezing Drizzle",
    icon: "🌧️❄️",
    severity: "poor"
  },

  57: {
    text: "Dense Freezing Drizzle",
    icon: "🌧️❄️",
    severity: "severe"
  },

  61: {
    text: "Slight Rain",
    icon: "🌧️",
    severity: "normal"
  },

  63: {
    text: "Moderate Rain",
    icon: "🌧️",
    severity: "caution"
  },

  65: {
    text: "Heavy Rain",
    icon: "🌧️",
    severity: "poor"
  },

  66: {
    text: "Light Freezing Rain",
    icon: "🌧️❄️",
    severity: "poor"
  },

  67: {
    text: "Heavy Freezing Rain",
    icon: "🌧️❄️",
    severity: "severe"
  },

  71: {
    text: "Slight Snowfall",
    icon: "🌨️",
    severity: "caution"
  },

  73: {
    text: "Moderate Snowfall",
    icon: "🌨️",
    severity: "poor"
  },

  75: {
    text: "Heavy Snowfall",
    icon: "❄️",
    severity: "severe"
  },

  77: {
    text: "Snow Grains",
    icon: "🌨️",
    severity: "caution"
  },

  80: {
    text: "Slight Rain Showers",
    icon: "🌦️",
    severity: "normal"
  },

  81: {
    text: "Moderate Rain Showers",
    icon: "🌧️",
    severity: "caution"
  },

  82: {
    text: "Violent Rain Showers",
    icon: "⛈️",
    severity: "severe"
  },

  85: {
    text: "Slight Snow Showers",
    icon: "🌨️",
    severity: "caution"
  },

  86: {
    text: "Heavy Snow Showers",
    icon: "❄️",
    severity: "severe"
  },

  95: {
    text: "Thunderstorm",
    icon: "⛈️",
    severity: "poor"
  },

  96: {
    text: "Thunderstorm with Slight Hail",
    icon: "⛈️",
    severity: "severe"
  },

  99: {
    text: "Thunderstorm with Heavy Hail",
    icon: "⛈️",
    severity: "severe"
  }
};

export default weatherCodes;