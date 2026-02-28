import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Upload } from '@/pages/Upload'

describe('Upload Page', () => {
  it('renders upload guide and submit button', () => {
    render(<Upload />)
    expect(screen.getByText('解析 OCR')).toBeInTheDocument()
    expect(screen.getByText('上傳門診表圖片')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '送出解析任務（預留 API 串接）' })
    ).toBeInTheDocument()
  })
})
