import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function formatCPFCNPJ(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return formatCPF(cleaned)
  } else if (cleaned.length === 14) {
    return formatCNPJ(cleaned)
  }
  return value
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export function formatCEP(cep: string): string {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2')
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) {
    return false
  }

  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i)
  }

  remainder = (sum * 10) % 11

  if (remainder === 10 || remainder === 11) {
    remainder = 0
  }

  if (remainder !== parseInt(cleaned.substring(9, 10))) {
    return false
  }

  sum = 0

  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i)
  }

  remainder = (sum * 10) % 11

  if (remainder === 10 || remainder === 11) {
    remainder = 0
  }

  if (remainder !== parseInt(cleaned.substring(10, 11))) {
    return false
  }

  return true
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) {
    return false
  }

  let length = cleaned.length - 2
  let numbers = cleaned.substring(0, length)
  const digits = cleaned.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) {
      pos = 9
    }
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)

  if (result !== parseInt(digits.charAt(0))) {
    return false
  }

  length = length + 1
  numbers = cleaned.substring(0, length)
  sum = 0
  pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) {
      pos = 9
    }
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)

  if (result !== parseInt(digits.charAt(1))) {
    return false
  }

  return true
}

export function validateCPFCNPJ(value: string): boolean {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return validateCPF(cleaned)
  } else if (cleaned.length === 14) {
    return validateCNPJ(cleaned)
  }
  return false
}
