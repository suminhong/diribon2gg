import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import styled from '@emotion/styled'
import { getDigimonImageUrl } from '../utils/imageUtils'
import { parseCsv } from '../utils/csvUtils'

function DigimonDetail() {
  const { id } = useParams()
  const [digimon, setDigimon] = useState(null)
  const [evolutions, setEvolutions] = useState(null)
  const [stages, setStages] = useState(null)
  const [elements, setElements] = useState(null)
  const [attributes, setAttributes] = useState(null)
  const [species, setSpecies] = useState(null)

  useEffect(() => {
    fetchDigimonData()
  }, [id])

  const fetchDigimonData = async () => {
    // Fetch metadata
    const [stagesRes, elementsRes, attributesRes, speciesRes] = await Promise.all([
      fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/stages.csv'),
      fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/elements.csv'),
      fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/attributes.csv'),
      fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/species.csv')
    ])

    const [stagesText, elementsText, attributesText, speciesText] = await Promise.all([
      stagesRes.text(),
      elementsRes.text(),
      attributesRes.text(),
      speciesRes.text()
    ])

    setStages(parseCsv(stagesText))
    setElements(parseCsv(elementsText))
    setAttributes(parseCsv(attributesText))
    setSpecies(parseCsv(speciesText))
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

  if (!digimon || !evolutions || !stages || !elements || !attributes || !species) return <div>Loading...</div>

  const stage = stages.find(s => s.name_en === digimon.stage)
  const element = elements.find(e => e.name_en === digimon.element)
  const attribute = attributes.find(a => a.name_en === digimon.attribute)
  const specie = species.find(s => s.name_en === digimon.species)

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
        <SectionTitle>⬇️ Evolution From</SectionTitle>
      </EvolutionSection>
      
      <DigimonInfo>
        <DigimonImageSection>
          <DigimonImage
            src={getDigimonImageUrl(digimon.name_en)}
            alt={digimon.name_en}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder.png';
            }}
          />
        </DigimonImageSection>
        <DigimonDetailsSection>
          <DigimonName>{digimon.name_kr} ({digimon.name_en})</DigimonName>
          <BadgeContainer>
            {stage && <Badge style={{ backgroundColor: stage.color, color: '#000' }}>{stage.name_kr}({stage.name_en})</Badge>}
            {element && <Badge style={{ backgroundColor: element.color, color: '#fff' }}>{element.name_kr}({element.name_en}) 속성</Badge>}
            {attribute && <Badge>{attribute.name_kr}({attribute.name_en}) 타입</Badge>}
            {specie && <Badge>{specie.name_kr}({specie.name_en})</Badge>}
          </BadgeContainer>
        </DigimonDetailsSection>
      </DigimonInfo>

      <SectionTitle>⬇️ Evolution To</SectionTitle>
      <EvolutionSection>
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
  gap: 2rem;
  margin: 2rem 0;
`

const DigimonImageSection = styled.div`
  flex: 0 0 auto;
`

const DigimonDetailsSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const BadgeContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const Badge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background-color: #f3f4f6;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`

const SectionTitle = styled.h2`
  text-align: left;
  margin: 2rem 0 1rem;
`

const DigimonImage = styled.img`
  width: 200px;
  height: 200px;
  object-fit: contain;
`

const DigimonName = styled.h1`
  text-align: left;
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
