import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Follows } from '@/pages/Follows'

describe('Follows Page', () => {
  it('renders search box and section title', () => {
    render(<Follows />)
    expect(screen.getByText('我的關注')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('搜尋醫師或醫院...')).toBeInTheDocument()
  })
})
