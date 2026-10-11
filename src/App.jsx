import { useState, useEffect } from 'react'
import {
  Sun,
  Moon,
  Search,
  Wind,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  CloudFog,
  MapPin,
  RefreshCw,
  AlertCircle,
  Thermometer,
  Compass
} from 'lucide-react'
import './App.css'

const QUICK_CITIES = ['Bergen', 'Oslo', 'Trondheim', 'Tromsø', 'Førde', 'Sogndal', 'Ålesund', 'London']

function getWeatherDetails(code) {
  if (code === undefined || code === null) {
    return { label: 'Ukjent vêr', icon: Cloud, tip: 'Ingen vêrdetaljar tilgjengeleg.' }
  }

  switch (Number(code)) {
    case 0:
      return { label: 'Klart og solrik', icon: Sun, tip: 'Nyt sola og den fine dagen! ☀️' }
    case 1:
    case 2:
      return { label: 'Lettskya', icon: CloudSun, tip: 'Fint vêr med litt skyer på himmelen. ⛅' }
    case 3:
      return { label: 'Skya', icon: Cloud, tip: 'Grei dag, men skyene dekkjer himmelen. ☁️' }
    case 45:
    case 48:
      return { label: 'Skodde', icon: CloudFog, tip: 'Minka sikt. Ta det med ro i trafikken! 🌫️' }
    case 51:
    case 53:
    case 55:
      return { label: 'Yr / lett regn', icon: CloudDrizzle, tip: 'Lurt å ta med ein lett jakke eller paraply. 🌧️' }
    case 56:
    case 57:
      return { label: 'Frysande yr', icon: CloudDrizzle, tip: 'Obs! Fare for glatte vegar! ❄️' }
    case 61:
    case 63:
    case 65:
      return { label: 'Regn', icon: CloudRain, tip: 'Hugs paraply eller regntøy i dag! ☔' }
    case 66:
    case 67:
      return { label: 'Frysande regn', icon: CloudRain, tip: 'Sleipt føre! Passer på på vegane. 🧊' }
    case 71:
    case 73:
    case 75:
    case 77:
      return { label: 'Snø', icon: CloudSnow, tip: 'Påkled deg varmt og nyt snøen! ❄️' }
    case 80:
    case 81:
    case 82:
      return { label: 'Regnbyger', icon: CloudRain, tip: 'Byger kan kome brått, ver førebudd! 🌦️' }
    case 85:
    case 86:
      return { label: 'Snøbyger', icon: CloudSnow, tip: 'Snøbyger i vente. Varm jakke anbefalast! 🌨️' }
    case 95:
    case 96:
    case 99:
      return { label: 'Tordenvêr', icon: CloudLightning, tip: 'Torde og lyn i området! Hold deg innendørs. 🌩️' }
    default:
      return { label: 'Skya vêr', icon: Cloud, tip: 'Sjekk vêrmeldinga før du går ut.' }
  }
}

function App() {
  const [city, setCity] = useState('')
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Initial default fetch for Bergen when app loads
  useEffect(() => {
    fetchWeatherFor('Bergen')
  }, [])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const fetchWeatherFromOpenMeteo = async (cityName) => {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName.trim())}&count=1&language=no&format=json`
    const geoRes = await fetch(geoUrl)
    if (!geoRes.ok) throw new Error(`Geocoding feila (${geoRes.status})`)
    const geoData = await geoRes.json()

    if (!geoData.results || geoData.results.length === 0) {
      return { error: `Hallo, ikkje finn på plassa: ${cityName}` }
    }

    const plass = geoData.results[0]
    const { latitude, longitude, name: plassnamn, country: land } = plass

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code`
    const weatherRes = await fetch(weatherUrl)
    if (!weatherRes.ok) throw new Error(`Vêr-API feila (${weatherRes.status})`)
    const weatherData = await weatherRes.json()

    return {
      by: plassnamn,
      land: land || '',
      temperatur: weatherData.current?.temperature_2m,
      vind: weatherData.current?.wind_speed_10m,
      weatherCode: weatherData.current?.weather_code
    }
  }

  const fetchWeatherFor = async (cityName) => {
    if (!cityName || !cityName.trim()) return

    setLoading(true)
    setError('')

    try {
      let data = null
      try {
        // Backend expects 'by' parameter: /api/weather?by=...
        const response = await fetch(`/api/weather?by=${encodeURIComponent(cityName.trim())}`)

        if (response.ok) {
          data = await response.json()
        } else {
          // Fallback to direct client-side fetch if backend is not available (e.g., GitHub Pages)
          data = await fetchWeatherFromOpenMeteo(cityName)
        }
      } catch (backendErr) {
        // Fallback to direct client-side fetch on network error / static hosting
        data = await fetchWeatherFromOpenMeteo(cityName)
      }

      // Backend returns "erreor" or "error" key if city was not found
      if (data.erreor || data.error) {
        setError(data.erreor || data.error)
        setWeatherData(null)
      } else {
        setWeatherData(data)
      }
    } catch (err) {
      setError(err.message || 'Kunne ikkje hente vêrdata.')
      setWeatherData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchWeatherFor(city)
  }

  const weatherDetails = weatherData ? getWeatherDetails(weatherData.weatherCode) : null
  const WeatherIcon = weatherDetails ? weatherDetails.icon : Cloud

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-badge">
            <CloudSun className="logo-icon" size={28} />
          </div>
          <div>
            <h1 className="app-title">Vêr-app</h1>
            <p className="app-subtitle">Lokalt vêr i heile verda</p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Bytt mørk/lys modus"
          title={theme === 'dark' ? 'Skift til lys modus' : 'Skift til mørk modus'}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={20} className="theme-icon sun" />
              <span>Lys modus</span>
            </>
          ) : (
            <>
              <Moon size={20} className="theme-icon moon" />
              <span>Mørk modus</span>
            </>
          )}
        </button>
      </header>

      <main className="main-content">
        <section className="search-section">
          <form onSubmit={handleSubmit} className="search-form">
            <div className="input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Skriv inn ein by (t.d. Bergen, Oslo)..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="search-input"
              />
              {city && (
                <button
                  type="button"
                  className="clear-btn"
                  onClick={() => setCity('')}
                >
                  ×
                </button>
              )}
            </div>
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? <RefreshCw className="spin" size={18} /> : 'Søk'}
            </button>
          </form>

          <div className="quick-cities">
            <span className="quick-label">Snarvegar:</span>
            <div className="chips-wrapper">
              {QUICK_CITIES.map((item) => (
                <button
                  key={item}
                  className={`chip-btn ${weatherData?.by?.toLowerCase() === item.toLowerCase() ? 'active' : ''}`}
                  onClick={() => {
                    setCity(item)
                    fetchWeatherFor(item)
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading && (
          <div className="status-card loading-card">
            <RefreshCw className="spin main-loader" size={36} />
            <p>Hentar oppdatert vêrdata...</p>
          </div>
        )}

        {error && !loading && (
          <div className="status-card error-card">
            <AlertCircle size={32} className="error-icon" />
            <div className="error-text">
              <h3>Fann ikkje vêret</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {weatherData && !loading && (
          <section className="weather-card">
            <div className="card-header">
              <div className="location-info">
                <MapPin size={22} className="pin-icon" />
                <div>
                  <h2 className="city-name">{weatherData.by}</h2>
                  {weatherData.land && <span className="country-badge">{weatherData.land}</span>}
                </div>
              </div>
              <button
                className="refresh-btn"
                onClick={() => fetchWeatherFor(weatherData.by)}
                title="Oppdater vêret"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="hero-weather">
              <div className="weather-icon-wrapper">
                <WeatherIcon size={80} className="weather-hero-icon" />
              </div>
              <div className="temp-container">
                <span className="temperature">
                  {weatherData.temperatur !== undefined && weatherData.temperatur !== null
                    ? Math.round(weatherData.temperatur)
                    : '--'}
                  <span className="degree-unit">°C</span>
                </span>
                <p className="weather-label">{weatherDetails.label}</p>
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-icon-bg">
                  <Wind size={22} />
                </div>
                <div className="detail-info">
                  <span className="detail-label">Vindstyrke</span>
                  <span className="detail-value">
                    {weatherData.vind !== undefined ? `${weatherData.vind} m/s` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-bg">
                  <Thermometer size={22} />
                </div>
                <div className="detail-info">
                  <span className="detail-label">Temperatur</span>
                  <span className="detail-value">{weatherData.temperatur}°C</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-bg">
                  <Compass size={22} />
                </div>
                <div className="detail-info">
                  <span className="detail-label">Vêrkode</span>
                  <span className="detail-value">Kode {weatherData.weatherCode}</span>
                </div>
              </div>
            </div>

            <div className="tip-box">
              <p className="tip-text">{weatherDetails.tip}</p>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>Vêrdata levert av Open-Meteo via Spring Boot backend</p>
      </footer>
    </div>
  )
}

export default App
