import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { BottomNav } from '@/components/layout/BottomNav'

describe('BottomNav', () => {
    it('renders correctly with 4 main navigation tabs', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <BottomNav />
            </MemoryRouter>
        )

        expect(screen.getByText('首頁')).toBeInTheDocument()
        expect(screen.getByText('關注名單')).toBeInTheDocument()
        expect(screen.getByText('解析 OCR')).toBeInTheDocument()
        expect(screen.getByText('每日推播')).toBeInTheDocument()
    })
})
