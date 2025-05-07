import { Link } from 'react-router-dom'
import styled from '@emotion/styled'

function Header() {
  return (
    <HeaderContainer>
      <Link to="/">
        <Logo>디리본2 진화도감</Logo>
      </Link>
      <GithubLink href="https://github.com/suminhong/diribon2gg" target="_blank" rel="noopener noreferrer">
        Github
      </GithubLink>
    </HeaderContainer>
  )
}

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
`

const Logo = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: #333;
  text-decoration: none;
`

const GithubLink = styled.a`
  color: #333;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`

export default Header
