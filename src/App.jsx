import { useState } from 'react'
import './App.css'

function App() {
  const [city, setCity] = useState('')
  const [weatherData, setWeatherData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchWeather = async (e) => {
    e.preventDefault()
    if (!city.trim()) return

    setLoading(true)
    setError('')
    setWeatherData(null)

    try {

      const response = await fetch(`http://localhost:5173/api/weather?city=${encodeURIComponent(city)}`)

      if (!response.ok) {
        throw new Error(`Feil frå server: ${response.status}`)
      }

      const data = await response.json()
      setWeatherData(data)
    } catch (err) {
      setError(err.message || 'Kunne ikkje hente vêrdata')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="weather-app">
      <h1>Vêr-app ⛅</h1>

      <form onSubmit={fetchWeather}>
        <input
          type="text"
          placeholder="Skriv inn ein by (t.d. Bergen)..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit">Søk</button>
      </form>

      {loading && <p>Hentar data frå Spring Boot...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {weatherData && (
        <pre style={{ textAlign: 'left', background: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
          {JSON.stringify(weatherData, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default App

