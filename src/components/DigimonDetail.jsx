import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import styled from '@emotion/styled'
import { getDigimonImageUrl } from '../utils/imageUtils'
import { parseCsv } from '../utils/csvUtils'

const formatDigimonNameForUrl = (name) => {
  return name
    .toLowerCase() // 소문자로 변경
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거 (하이픈 제외)
    .replace(/\s+/g, '-') // 띄어쓰기를 하이픈으로 대체
    .trim() // 앞뒤 공백 제거
}

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

  const getEvolutionRequirements = (fromDigimon, toDigimon, evolutionsData) => {
    const evolution = evolutionsData.find(e => 
      e.from === fromDigimon && e.to === toDigimon
    )
    return evolution?.requirements || []
  }

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
        .map(e => ({
          digimon: digimons.find(d => d.name_en === e.from),
          requirements: e.requirements || []
        }))
        .filter(e => e.digimon)

      const to = evolutionsData
        .filter(e => e.from === currentDigimon.name_en)
        .map(e => ({
          digimon: digimons.find(d => d.name_en === e.to),
          requirements: e.requirements || []
        }))
        .filter(e => e.digimon)

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
          {evolutions.from.map(({ digimon, requirements }) => (
            <EvolutionCard key={digimon.id} to={`/digimon/${digimon.id}`}>
              <EvolutionImage
                src={getDigimonImageUrl(digimon.name_en)}
                alt={digimon.name_en}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder.png';
                }}
              />
              <EvolutionInfo>
                <EvolutionName>{digimon.name_kr} ({digimon.name_en})</EvolutionName>
                <Requirements>
                  {requirements.map((req, index) => (
                    <Requirement key={index}>{req}</Requirement>
                  ))}
                </Requirements>
              </EvolutionInfo>
            </EvolutionCard>
          ))}
          {evolutions.from.length === 0 && <p>No evolutions found</p>}
        </EvolutionGrid>
        <SectionTitle>⬇️ Evolution</SectionTitle>
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
            {attribute && <Badge style={{ backgroundColor: attribute.color, color: '#fff' }}>{attribute.name_kr}({attribute.name_en}) 타입</Badge>}
            {specie && <Badge>{specie.name_kr}({specie.name_en})</Badge>}
          </BadgeContainer>
          <GrindosourLink 
            href={`https://www.grindosaur.com/en/games/digital-tamers-2/${digimon.stage === 'DigiTama' ? 'digitama' : 'digimon'}/${formatDigimonNameForUrl(digimon.name_en)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img 
              src="https://www.grindosaur.com/img/brand/assets/grindosaur-brand-name.svg" 
              alt="Grindosaur" 
              style={{ height: '0.875rem' }}
            />
            에서 보기 🚀
          </GrindosourLink>
        </DigimonDetailsSection>
      </DigimonInfo>

      <SectionTitle>⬇️ Evolution</SectionTitle>
      <EvolutionSection>
        <EvolutionGrid>
          {evolutions.to.map(({ digimon, requirements }) => (
            <EvolutionCard key={digimon.id} to={`/digimon/${digimon.id}`}>
              <EvolutionImage
                src={getDigimonImageUrl(digimon.name_en)}
                alt={digimon.name_en}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder.png';
                }}
              />
              <EvolutionInfo>
                <EvolutionName>{digimon.name_kr} ({digimon.name_en})</EvolutionName>
                <Requirements>
                  {requirements.map((req, index) => (
                    <Requirement key={index}>{req}</Requirement>
                  ))}
                </Requirements>
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

  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const DigimonInfo = styled.div`
  display: flex;
  gap: 2rem;
  margin: 2rem 0;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0;
  }
`

const DigimonImageSection = styled.div`
  flex: 0 0 auto;

  @media (max-width: 768px) {
    display: flex;
    justify-content: center;
  }
`

const DigimonImage = styled.img`
  width: 200px;
  height: 200px;
  object-fit: contain;

  @media (max-width: 768px) {
    width: 180px;
    height: 180px;
  }
`

const DigimonDetailsSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 768px) {
    align-items: center;
    text-align: center;
  }
`

const DigimonName = styled.h1`
  text-align: left;
  margin: 1rem 0 0.5rem;
  font-size: 2rem;
  color: #333;

  @media (max-width: 768px) {
    text-align: center;
    font-size: 1.75rem;
  }
`

const BadgeContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
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

const SectionTitle = styled.h1`
  font-size: 2rem;
  margin: 0 0 1rem 0;
  color: #111827;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`

const EvolutionSection = styled.section`
  margin: 2rem 0;

  @media (max-width: 768px) {
    margin: 1.5rem 0;
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
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Requirements = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const Requirement = styled.span`
  font-size: 0.875rem;
  color: #666;
`

const EvolutionName = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
`

const GrindosourLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  img {
    filter: invert(37%) sepia(74%) saturate(1909%) hue-rotate(211deg) brightness(97%) contrast(101%);
  }

  &:hover {
    color: #1d4ed8;
    img {
      filter: invert(23%) sepia(92%) saturate(1861%) hue-rotate(221deg) brightness(94%) contrast(101%);
    }
  }
`

export default DigimonDetail
