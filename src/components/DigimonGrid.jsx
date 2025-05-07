import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from '@emotion/styled'
import { getDigimonImageUrl } from '../utils/imageUtils'
import { parseCsv } from '../utils/csvUtils'

const SORT_TYPES = {
  STAGE_ASC: 'stage_asc',
  STAGE_DESC: 'stage_desc',
  KR_ASC: 'kr_asc',
  KR_DESC: 'kr_desc',
  EN_ASC: 'en_asc',
  EN_DESC: 'en_desc'
}

function DigimonGrid() {
  const [digimons, setDigimons] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortType, setSortType] = useState(SORT_TYPES.STAGE_ASC)
  const [selectedStages, setSelectedStages] = useState(new Set())
  const [selectedSpecies, setSelectedSpecies] = useState(new Set())
  const [selectedElements, setSelectedElements] = useState(new Set())
  const [selectedAttributes, setSelectedAttributes] = useState(new Set())
  const [openDropdown, setOpenDropdown] = useState(null)
  const [metadata, setMetadata] = useState({
    stages: [],
    species: [],
    elements: [],
    attributes: []
  })

  const getStageColor = (stageName) => {
    const stage = metadata.stages.find(s => s.name_en === stageName)
    if (!stage) return 'transparent'
    // Convert hex to rgba with 0.15 opacity
    if (stage.color === 'white') return 'rgba(255, 255, 255, 0.5)'
    const hex = stage.color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, 0.15)`
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.filter-group')) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openDropdown])

  useEffect(() => {
    fetchDigimons()
    fetchMetadata()
  }, [])

  const fetchMetadata = async () => {
    try {
      const [stagesRes, speciesRes, elementsRes, attributesRes] = await Promise.all([
        fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/stages.csv'),
        fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/species.csv'),
        fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/elements.csv'),
        fetch('https://raw.githubusercontent.com/suminhong/diribon2gg/main/database/attributes.csv')
      ])

      const [stagesText, speciesText, elementsText, attributesText] = await Promise.all([
        stagesRes.text(),
        speciesRes.text(),
        elementsRes.text(),
        attributesRes.text()
      ])

      setMetadata({
        stages: parseCsv(stagesText),
        species: parseCsv(speciesText),
        elements: parseCsv(elementsText),
        attributes: parseCsv(attributesText)
      })
    } catch (error) {
      console.error('Error fetching metadata:', error)
    }
  }

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

  const handleSortClick = (type) => {
    if (type === 'stage') {
      setSortType(sortType === SORT_TYPES.STAGE_ASC ? SORT_TYPES.STAGE_DESC : SORT_TYPES.STAGE_ASC)
    } else if (type === 'kr') {
      setSortType(sortType === SORT_TYPES.KR_ASC ? SORT_TYPES.KR_DESC : SORT_TYPES.KR_ASC)
    } else if (type === 'en') {
      setSortType(sortType === SORT_TYPES.EN_ASC ? SORT_TYPES.EN_DESC : SORT_TYPES.EN_ASC)
    }
  }

  const toggleFilter = (set, setValue, item) => {
    const newSet = new Set(set)
    if (newSet.has(item)) {
      newSet.delete(item)
    } else {
      newSet.add(item)
    }
    setValue(newSet)
  }

  const toggleAll = (setValue, items, isSelected) => {
    if (isSelected) {
      setValue(new Set(items.map(item => item.name_en)))
    } else {
      setValue(new Set())
    }
  }

  const filteredDigimons = digimons
    .filter(digimon => {
      const matchesSearch = (
        (digimon.name_kr?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (digimon.name_en?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      
      const matchesStages = selectedStages.size === 0 || selectedStages.has(digimon.stage)
      const matchesSpecies = selectedSpecies.size === 0 || selectedSpecies.has(digimon.species)
      const matchesElements = selectedElements.size === 0 || selectedElements.has(digimon.element)
      const matchesAttributes = selectedAttributes.size === 0 || selectedAttributes.has(digimon.attribute)
      
      return matchesSearch && matchesStages && matchesSpecies && matchesElements && matchesAttributes
    })
    .sort((a, b) => {
      const stageOrder = metadata.stages.reduce((acc, stage, index) => {
        acc[stage.name_en] = index;
        return acc;
      }, {});

      switch (sortType) {
        case SORT_TYPES.STAGE_ASC:
          const stageCompare = (stageOrder[a.stage] || 0) - (stageOrder[b.stage] || 0);
          return stageCompare === 0 ? (a.name_kr || '').localeCompare(b.name_kr || '') : stageCompare;
        case SORT_TYPES.STAGE_DESC:
          const stageCompareDesc = (stageOrder[b.stage] || 0) - (stageOrder[a.stage] || 0);
          return stageCompareDesc === 0 ? (a.name_kr || '').localeCompare(b.name_kr || '') : stageCompareDesc;
        case SORT_TYPES.KR_ASC:
          return (a.name_kr || '').localeCompare(b.name_kr || '')
        case SORT_TYPES.KR_DESC:
          return (b.name_kr || '').localeCompare(a.name_kr || '')
        case SORT_TYPES.EN_ASC:
          return (a.name_en || '').localeCompare(b.name_en || '')
        case SORT_TYPES.EN_DESC:
          return (b.name_en || '').localeCompare(a.name_en || '')
        default:
          return 0
      }
    })

  return (
    <div>
      <Citation>
        본 사이트는 <StyledLink href="https://www.grindosaur.com/en/games/digital-tamers-2" target="_blank" rel="noopener noreferrer">Grindosaur 사이트</StyledLink>에서 정보를 가져와 직접 명칭들을 번역하고 조합해 만들어 졌습니다.<br />
        제작자가 잘 모르는 부분이 많습니다. 틀린 부분 또는 개선할 점이 있다면 honglab97@gmail.com 으로 연락 주세요.
      </Citation>
      
      <Controls>
        <SearchInput
          type="text"
          placeholder="디지몬 검색 (한글/영어)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <ControlsRow>
          <SortButtons>
            <SortButton 
              onClick={() => handleSortClick('stage')}
              active={sortType === SORT_TYPES.STAGE_ASC || sortType === SORT_TYPES.STAGE_DESC}
            >
              스테이지순 {sortType === SORT_TYPES.STAGE_ASC ? '↓' : '↑'}
            </SortButton>
            <SortButton 
              onClick={() => handleSortClick('kr')}
              active={sortType === SORT_TYPES.KR_ASC || sortType === SORT_TYPES.KR_DESC}
            >
              가나다순 {sortType === SORT_TYPES.KR_ASC ? '↓' : '↑'}
            </SortButton>
            <SortButton 
              onClick={() => handleSortClick('en')}
              active={sortType === SORT_TYPES.EN_ASC || sortType === SORT_TYPES.EN_DESC}
            >
              알파벳순 {sortType === SORT_TYPES.EN_ASC ? '↓' : '↑'}
            </SortButton>
          </SortButtons>
          <FilterSection>
          <FilterDropdowns>
            <FilterGroup className="filter-group">
              <FilterButton 
                onClick={() => setOpenDropdown(openDropdown === 'stage' ? null : 'stage')}
                active={selectedStages.size > 0}
              >
                스테이지 {selectedStages.size > 0 && `(${selectedStages.size})`}
              </FilterButton>
              {openDropdown === 'stage' && (
                <DropdownMenu>
                  <SelectAllItem
                    onClick={() => toggleAll(setSelectedStages, metadata.stages, selectedStages.size < metadata.stages.length)}
                  >
                    {selectedStages.size === metadata.stages.length ? '전체 해제' : '전체 선택'}
                  </SelectAllItem>
                  <Divider />
                  {metadata.stages.map(stage => (
                    <DropdownItem
                      key={stage.name_en}
                      onClick={() => toggleFilter(selectedStages, setSelectedStages, stage.name_en)}
                    >
                      <Checkbox checked={selectedStages.has(stage.name_en)} />
                      <span>{stage.name_kr}</span>
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              )}
            </FilterGroup>

            <FilterGroup className="filter-group">
              <FilterButton 
                onClick={() => setOpenDropdown(openDropdown === 'species' ? null : 'species')}
                active={selectedSpecies.size > 0}
              >
                종족 {selectedSpecies.size > 0 && `(${selectedSpecies.size})`}
              </FilterButton>
              {openDropdown === 'species' && (
                <DropdownMenu>
                  <SelectAllItem
                    onClick={() => toggleAll(setSelectedSpecies, metadata.species, selectedSpecies.size < metadata.species.length)}
                  >
                    {selectedSpecies.size === metadata.species.length ? '전체 해제' : '전체 선택'}
                  </SelectAllItem>
                  <Divider />
                  {metadata.species.map(specie => (
                    <DropdownItem
                      key={specie.name_en}
                      onClick={() => toggleFilter(selectedSpecies, setSelectedSpecies, specie.name_en)}
                    >
                      <Checkbox checked={selectedSpecies.has(specie.name_en)} />
                      <span>{specie.name_kr}</span>
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              )}
            </FilterGroup>

            <FilterGroup className="filter-group">
              <FilterButton 
                onClick={() => setOpenDropdown(openDropdown === 'element' ? null : 'element')}
                active={selectedElements.size > 0}
              >
                속성 {selectedElements.size > 0 && `(${selectedElements.size})`}
              </FilterButton>
              {openDropdown === 'element' && (
                <DropdownMenu>
                  <SelectAllItem
                    onClick={() => toggleAll(setSelectedElements, metadata.elements, selectedElements.size < metadata.elements.length)}
                  >
                    {selectedElements.size === metadata.elements.length ? '전체 해제' : '전체 선택'}
                  </SelectAllItem>
                  <Divider />
                  {metadata.elements.map(element => (
                    <DropdownItem
                      key={element.name_en}
                      onClick={() => toggleFilter(selectedElements, setSelectedElements, element.name_en)}
                    >
                      <Checkbox checked={selectedElements.has(element.name_en)} />
                      <span>{element.name_kr}</span>
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              )}
            </FilterGroup>

            <FilterGroup className="filter-group">
              <FilterButton 
                onClick={() => setOpenDropdown(openDropdown === 'attribute' ? null : 'attribute')}
                active={selectedAttributes.size > 0}
              >
                타입 {selectedAttributes.size > 0 && `(${selectedAttributes.size})`}
              </FilterButton>
              {openDropdown === 'attribute' && (
                <DropdownMenu>
                  <SelectAllItem
                    onClick={() => toggleAll(setSelectedAttributes, metadata.attributes, selectedAttributes.size < metadata.attributes.length)}
                  >
                    {selectedAttributes.size === metadata.attributes.length ? '전체 해제' : '전체 선택'}
                  </SelectAllItem>
                  <Divider />
                  {metadata.attributes.map(attribute => (
                    <DropdownItem
                      key={attribute.name_en}
                      onClick={() => toggleFilter(selectedAttributes, setSelectedAttributes, attribute.name_en)}
                    >
                      <Checkbox checked={selectedAttributes.has(attribute.name_en)} />
                      <span>{attribute.name_kr}</span>
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              )}
            </FilterGroup>
          </FilterDropdowns>
        </FilterSection>
        </ControlsRow>
      </Controls>
      <Grid>
        {filteredDigimons.map((digimon, index) => (
          <DigimonCard 
            key={digimon.id || index} 
            to={`/digimon/${digimon.id || ''}`}
            backgroundColor={getStageColor(digimon.stage)}
          >
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

const StyledLink = styled.a`
  color: #2196f3;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`

const Citation = styled.blockquote`
text-align: left;
  background-color: #fffde7;
  border-left: 4px solid #ffd54f;
  margin: 0 0 1rem 0;
  padding: 1rem;
  font-size: 0.9rem;
  line-height: 1.6;
`

const Controls = styled.div`
  margin-bottom: 2rem;
`

const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const SearchInput = styled.input`
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`

const SortButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`

const SortButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: ${props => props.active ? '#e5e7eb' : 'white'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`

const FilterSection = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    width: 100%;
  }
`

const FilterDropdowns = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`

const FilterGroup = styled.div`
  position: relative;
`

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: ${props => props.active ? '#e5e7eb' : 'white'};
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background-color: #f3f4f6;
  }

  @media (max-width: 768px) {
    flex: 1;
    min-width: calc(50% - 0.25rem);
  }
`

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 10;
  min-width: 160px;
  margin-top: 0.25rem;
  padding: 0.5rem;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 480px) {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 60vh;
    overflow-y: auto;
  }
`

const SelectAllItem = styled.button`
  width: 100%;
  padding: 0.5rem;
  border: none;
  background-color: transparent;
  font-size: 0.875rem;
  color: #374151;
  text-align: center;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }
`

const Divider = styled.hr`
  margin: 0.5rem 0;
  border: none;
  border-top: 1px solid #e5e7eb;
`

const DropdownItem = styled.button`
  width: 100%;
  padding: 0.5rem;
  border: none;
  background-color: transparent;
  font-size: 0.875rem;
  color: #374151;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: #f3f4f6;
  }
`

const Checkbox = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  position: relative;
  flex-shrink: 0;
  ${props => props.checked && `
    background-color: #2563eb;
    border-color: #2563eb;
    &:after {
      content: '';
      position: absolute;
      left: 4px;
      top: 1px;
      width: 4px;
      height: 8px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  `}
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }
`

const DigimonCard = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
  background-color: ${props => props.backgroundColor};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`

const DigimonImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: contain;

  @media (max-width: 480px) {
    width: 80px;
    height: 80px;
  }
`

const DigimonName = styled.span`
  margin-top: 0.5rem;
  color: #333;
  text-align: center;
  font-size: 0.875rem;
  word-break: keep-all;
  width: 100%;

  @media (max-width: 480px) {
    font-size: 0.8125rem;
  }
`

export default DigimonGrid
