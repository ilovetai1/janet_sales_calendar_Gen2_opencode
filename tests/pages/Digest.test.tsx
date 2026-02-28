import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Digest } from '@/pages/Digest'

describe('Digest Page', () => {
  it('renders digest heading', () => {
    render(<Digest />)
    expect(screen.getByText('每日推播')).toBeInTheDocument()
  })
})
