import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import styled from '@emotion/styled'
import { getDigimonImageUrl } from '../utils/imageUtils'
import { parseCsv } from '../utils/csvUtils'

function DigimonDetail() {
  const { id } = useParams()
  const [digimon, setDigimon] = useState(null)
  const [evolutions, setEvolutions] = useState(null)

  useEffect(() => {
    fetchDigimonData()
  }, [id])

  const fetchDigimonData = async () => {
    if (!id) {
      console.error('No digimon ID provided');
      return;
    }
    try {
      // Fetch digimon info
      const digimonResponse = await fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/digimons.csv')
      const digimonText = await digimonResponse.text()
      const digimons = parseCsv(digimonText)
      const currentDigimon = digimons.find(d => d.name_en === id)
      
      if (!currentDigimon) {
        console.error('Digimon not found:', id)
        return
      }
      
      setDigimon(currentDigimon)

      // Fetch evolution data
      const evolutionsResponse = await fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/evolutions.json')
      const evolutionsData = await evolutionsResponse.json()
      
      // Find evolutions from and to
      const from = evolutionsData
        .filter(e => e.to === currentDigimon.name_en)
        .map(e => digimons.find(d => d.name_en === e.from))
        .filter(Boolean)

      const to = evolutionsData
        .filter(e => e.from === currentDigimon.name_en)
        .map(e => digimons.find(d => d.name_en === e.to))
        .filter(Boolean)

      setEvolutions({ from, to })
    } catch (error) {
      console.error('Error fetching digimon data:', error)
    }
  }

  if (!digimon || !evolutions) return <div>Loading...</div>

  return (
    <Container>
      <EvolutionSection>
        <EvolutionGrid>
          {evolutions.from.map(evolution => (
            <EvolutionCard key={evolution.id} to={`/digimon/${evolution.id}`}>
              <EvolutionImage
                src={getDigimonImageUrl(evolution.name_en)}
                alt={evolution.name_en}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder.png';
                }}
              />
              <EvolutionInfo>
                <EvolutionName>{evolution.name_kr} ({evolution.name_en})</EvolutionName>
              </EvolutionInfo>
            </EvolutionCard>
          ))}
          {evolutions.from.length === 0 && <p>No evolutions found</p>}
        </EvolutionGrid>
        <h2>⬇️ Evolution From</h2>
      </EvolutionSection>
      
      <DigimonInfo>
        <DigimonImage
          src={getDigimonImageUrl(digimon.name_en)}
          alt={digimon.name_en}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.png';
          }}
        />
        <DigimonName>{digimon.name_kr} ({digimon.name_en})</DigimonName>
      </DigimonInfo>

      <EvolutionSection>
        <h2>⬇️ Evolution To</h2>
        <EvolutionGrid>
          {evolutions.to.map(evolution => (
            <EvolutionCard key={evolution.id} to={`/digimon/${evolution.id}`}>
              <EvolutionImage
                src={getDigimonImageUrl(evolution.name_en)}
                alt={evolution.name_en}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder.png';
                }}
              />
              <EvolutionInfo>
                <EvolutionName>{evolution.name_kr} ({evolution.name_en})</EvolutionName>
              </EvolutionInfo>
            </EvolutionCard>
          ))}
          {evolutions.to.length === 0 && <p>No evolutions found</p>}
        </EvolutionGrid>
      </EvolutionSection>
    </Container>
  )
}

const Container = styled.div`
  padding: 2rem;
`

const DigimonInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
`

const DigimonImage = styled.img`
  width: 200px;
  height: 200px;
  object-fit: contain;
`

const DigimonName = styled.h1`
  margin: 1rem 0 0.5rem;
  font-size: 2rem;
  color: #333;
`

const DigimonNameEn = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  color: #666;
`

const EvolutionSection = styled.section`
  h2 {
    margin-bottom: 1rem;
  }
`

const EvolutionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`

const EvolutionCard = styled(Link)`
  display: flex;
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

const EvolutionImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: contain;
`

const EvolutionInfo = styled.div`
  margin-left: 1rem;
  flex: 1;
`

const EvolutionName = styled.h3`
  margin: 0 0 0.5rem;
  color: #333;
`

const Requirements = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const Requirement = styled.span`
  font-size: 0.9rem;
  color: #666;
`

export default DigimonDetail
