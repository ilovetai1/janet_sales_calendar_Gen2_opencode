import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Home } from '@/pages/Home'

describe('Home Page', () => {
    it('renders the header and main content area', () => {
        render(<Home />)
        expect(screen.getByText('首頁視圖')).toBeInTheDocument()
        // 我們預期會有歡迎詞或是區塊
        expect(screen.getByText('今日門診概況')).toBeInTheDocument()
    })
})
