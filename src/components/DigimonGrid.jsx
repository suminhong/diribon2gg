import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from '@emotion/styled'
import { getDigimonImageUrl } from '../utils/imageUtils'
import { parseCsv } from '../utils/csvUtils'

function DigimonGrid() {
  const [digimons, setDigimons] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchDigimons()
  }, [])

  const fetchDigimons = async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/digimons.csv')
      const text = await response.text()
      const data = parseCsv(text)
      setDigimons(data)
    } catch (error) {
      console.error('Error fetching digimons:', error)
    }
  }

  const filteredDigimons = digimons.filter(digimon =>
    (digimon.name_kr?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (digimon.name_en?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <SearchInput
        type="text"
        placeholder="디지몬 검색 (한글/영어)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Grid>
        {filteredDigimons.map((digimon, index) => (
          <DigimonCard key={digimon.id || index} to={`/digimon/${digimon.id || ''}`}>
            <DigimonImage
              src={getDigimonImageUrl(digimon.name_en)}
              alt={digimon.name_en}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder.png';
              }}
            />
            <DigimonName key="kr">{digimon.name_kr}</DigimonName>
            <DigimonName key="en">{digimon.name_en}</DigimonName>
          </DigimonCard>
        ))}
      </Grid>
    </div>
  )
}

const SearchInput = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
`

const DigimonCard = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  text-decoration: none;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`

const DigimonImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: contain;
`

const DigimonName = styled.span`
  margin-top: 0.5rem;
  color: #333;
  text-align: center;
`

export default DigimonGrid
