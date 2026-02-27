import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import App from '@/App'

describe('App Routing', () => {
    it('renders the layout and default home page content', () => {
        // Render standard App router tree (assumes App inside MemoryRouter or internally defines Router)
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        )

        // Bottom nav should be present
        expect(screen.getByText('每日推播')).toBeInTheDocument()
        // Placeholder for home
        expect(screen.getByText('首頁視圖 (Dashboard)')).toBeInTheDocument()
    })
})
