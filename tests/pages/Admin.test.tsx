import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Admin } from '@/pages/Admin'

describe('Admin Page', () => {
  it('renders review and manual entry sections', () => {
    render(<Admin />)
    expect(screen.getByText('門診表審核與手動建檔')).toBeInTheDocument()
    expect(screen.getByText('待審核上傳清單')).toBeInTheDocument()
    expect(screen.getByText('純手動建檔（MVP）')).toBeInTheDocument()
  })
})
