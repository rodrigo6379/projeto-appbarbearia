import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  Card,
  Button,
  Input,
  Select,
  EmptyState,
  Spinner,
  Toast,
  ConfirmDialog,
} from '../components/ui'
import { Wallet, CheckCircle2 } from 'lucide-react'

describe('Card', () => {
  it('renderiza conteúdo filho', () => {
    render(<Card><p>Conteúdo do card</p></Card>)
    expect(screen.getByText('Conteúdo do card')).toBeInTheDocument()
  })

  it('aplica classe personalizada', () => {
    const { container } = render(<Card className="minha-classe"><span>x</span></Card>)
    expect(container.firstChild).toHaveClass('minha-classe')
  })
})

describe('Button', () => {
  it('renderiza com texto', () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByText('Salvar')).toBeInTheDocument()
  })

  it('chama onClick ao clicar', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clique</Button>)
    fireEvent.click(screen.getByText('Clique'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('não chama onClick quando disabled', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>Bloqueado</Button>)
    fireEvent.click(screen.getByText('Bloqueado'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('aplica variante danger', () => {
    const { container } = render(<Button variant="danger">Excluir</Button>)
    expect(container.firstChild).toHaveClass('from-red-500')
  })

  it('submete formulário quando type é submit', () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Enviar</Button>
      </form>
    )
    fireEvent.click(screen.getByText('Enviar'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})

describe('Input', () => {
  it('renderiza com label', () => {
    render(<Input label="Nome do cliente" value="" onChange={() => {}} />)
    expect(screen.getByText('Nome do cliente')).toBeInTheDocument()
  })

  it('chama onChange ao digitar', () => {
    const onChange = vi.fn()
    render(<Input label="Descrição" value="" onChange={onChange} placeholder="Digite" />)
    fireEvent.change(screen.getByPlaceholderText('Digite'), { target: { value: 'novo valor' } })
    expect(onChange).toHaveBeenCalledWith('novo valor')
  })

  it('exibe mensagem de erro quando fornecida', () => {
    render(<Input label="Valor" value="" onChange={() => {}} error="Valor inválido" />)
    expect(screen.getByText('Valor inválido')).toBeInTheDocument()
  })

  it('não exibe erro quando não fornecido', () => {
    render(<Input label="Valor" value="" onChange={() => {}} />)
    expect(screen.queryByText('Valor inválido')).not.toBeInTheDocument()
  })
})

describe('Select', () => {
  it('renderiza opções', () => {
    const options = [
      { value: 'a', label: 'Opção A' },
      { value: 'b', label: 'Opção B' },
    ]
    render(<Select label="Categoria" value="a" onChange={() => {}} options={options} />)
    expect(screen.getByText('Categoria')).toBeInTheDocument()
    expect(screen.getByText('Opção A')).toBeInTheDocument()
    expect(screen.getByText('Opção B')).toBeInTheDocument()
  })

  it('chama onChange ao selecionar', () => {
    const onChange = vi.fn()
    const options = [
      { value: 'a', label: 'Opção A' },
      { value: 'b', label: 'Opção B' },
    ]
    render(<Select label="Cat" value="a" onChange={onChange} options={options} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } })
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

describe('EmptyState', () => {
  it('renderiza mensagem', () => {
    render(<EmptyState icon={<Wallet data-testid="icon" />} message="Nada encontrado" />)
    expect(screen.getByText('Nada encontrado')).toBeInTheDocument()
  })
})

describe('Spinner', () => {
  it('renderiza elemento de loading', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})

describe('Toast', () => {
  it('exibe mensagem de sucesso', () => {
    render(<Toast message="Salvo com sucesso" type="success" onClose={() => {}} />)
    expect(screen.getByText('Salvo com sucesso')).toBeInTheDocument()
  })

  it('exibe mensagem de erro', () => {
    render(<Toast message="Falha ao salvar" type="error" onClose={() => {}} />)
    expect(screen.getByText('Falha ao salvar')).toBeInTheDocument()
  })

  it('chama onClose ao clicar no botão de fechar', () => {
    const onClose = vi.fn()
    render(<Toast message="Teste" type="success" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('ConfirmDialog', () => {
  it('não renderiza quando open é false', () => {
    render(
      <ConfirmDialog open={false} title="Excluir" message="Confirma?" onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(screen.queryByText('Excluir')).not.toBeInTheDocument()
  })

  it('renderiza título e mensagem quando open', () => {
    render(
      <ConfirmDialog open={true} title="Excluir registro" message="Tem certeza?" onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(screen.getByText('Excluir registro')).toBeInTheDocument()
    expect(screen.getByText('Tem certeza?')).toBeInTheDocument()
  })

  it('chama onConfirm ao clicar no botão de confirmação', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog open={true} title="Excluir" message="Confirma?" onConfirm={onConfirm} onCancel={() => {}} />
    )
    fireEvent.click(screen.getByText('Excluir'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('chama onCancel ao clicar em Cancelar', () => {
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open={true} title="Excluir" message="Confirma?" onConfirm={() => {}} onCancel={onCancel} />
    )
    fireEvent.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('chama onCancel ao clicar no backdrop', () => {
    const onCancel = vi.fn()
    const { container } = render(
      <ConfirmDialog open={true} title="Excluir" message="Confirma?" onConfirm={() => {}} onCancel={onCancel} />
    )
    const backdrop = container.firstElementChild as HTMLElement
    fireEvent.click(backdrop)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('usa label de confirmação personalizado', () => {
    render(
      <ConfirmDialog open={true} title="Remover" message="Confirma?" confirmLabel="Remover" onConfirm={() => {}} onCancel={() => {}} />
    )
    expect(screen.getByText('Remover')).toBeInTheDocument()
  })
})
