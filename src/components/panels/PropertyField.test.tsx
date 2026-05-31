import { render, screen, fireEvent } from '@testing-library/react'
import { PropertyField } from './PropertyField'

const numberDef = {
  key: 'width',
  label: 'Ширина',
  type: 'number' as const,
  unit: 'мм',
  min: 1,
  max: 4000,
}

const selectDef = {
  key: 'color',
  label: 'Цвет',
  type: 'select' as const,
  options: [
    { label: 'Белый', value: 'Белый' },
    { label: 'Венге', value: 'Венге' },
    { label: 'Дуб', value: 'Дуб' },
  ],
}

describe('PropertyField — number', () => {
  it('renders label with unit', () => {
    render(<PropertyField def={numberDef} value={900} onChange={() => {}} />)
    expect(screen.getByLabelText('Ширина, мм')).toBeInTheDocument()
  })

  it('calls onChange with number on input', () => {
    const onChange = vi.fn()
    render(<PropertyField def={numberDef} value={900} onChange={onChange} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1200' } })
    expect(onChange).toHaveBeenCalledWith(1200)
  })

  it('does not call onChange on empty input', () => {
    const onChange = vi.fn()
    render(<PropertyField def={numberDef} value={900} onChange={onChange} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('clamps value to min when below range', () => {
    const onChange = vi.fn()
    render(<PropertyField def={numberDef} value={900} onChange={onChange} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-5' } })
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('clamps value to max when above range', () => {
    const onChange = vi.fn()
    render(<PropertyField def={numberDef} value={900} onChange={onChange} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '9999' } })
    expect(onChange).toHaveBeenCalledWith(4000)
  })

  it('label is bound to input via htmlFor/id', () => {
    render(<PropertyField def={numberDef} value={900} onChange={() => {}} />)
    const input = screen.getByLabelText('Ширина, мм')
    expect(input.tagName).toBe('INPUT')
  })
})

describe('PropertyField — select', () => {
  it('renders label without unit', () => {
    render(<PropertyField def={selectDef} value="Белый" onChange={() => {}} />)
    expect(screen.getByLabelText('Цвет')).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<PropertyField def={selectDef} value="Белый" onChange={() => {}} />)
    expect(screen.getByRole('option', { name: 'Белый' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Венге' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Дуб' })).toBeInTheDocument()
  })

  it('calls onChange with string on select change', () => {
    const onChange = vi.fn()
    render(<PropertyField def={selectDef} value="Белый" onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Венге' } })
    expect(onChange).toHaveBeenCalledWith('Венге')
  })
})
