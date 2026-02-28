import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import App from '@/App'

describe('App Routing', () => {
  it('renders the layout and default home page content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('每日推播')).toBeInTheDocument()
    expect(screen.getByText('今日門診概況')).toBeInTheDocument()
  })
})
