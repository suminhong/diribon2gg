import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import styled from '@emotion/styled'
import './App.css'
import Header from './components/Header'
import DigimonGrid from './components/DigimonGrid'
import DigimonDetail from './components/DigimonDetail'

function App() {
  return (
    <Router>
      <AppContainer>
        <Header />
        <MainContent>
          <Routes>
            <Route path="/" element={<DigimonGrid />} />
            <Route path="/digimon/:id" element={<DigimonDetail />} />
            <Route path="/digimon" element={<DigimonGrid />} />
            <Route path="*" element={<DigimonGrid />} />
          </Routes>
        </MainContent>
      </AppContainer>
    </Router>
  )
}

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`

const MainContent = styled.main`
  margin-top: 20px;
`
export default App
