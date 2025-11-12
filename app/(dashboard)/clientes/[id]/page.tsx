'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import {
  ArrowLeft,
  Edit,
  User,
  Car,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react'
import {
  formatCPFCNPJ,
  formatCurrency,
  formatPhone,
  formatCEP,
  formatDate,
} from '@/lib/utils'

interface Vehicle {
  id: string
  placa: string
  modelo: string
  marca: string | null
  ano: number | null
  imei_rastreador: string
  chip_numero: string
  operadora_chip: string | null
  ativo: boolean
  observacoes: string | null
  created_at: string
}

export default function ClienteDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<any>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [vehicleForm, setVehicleForm] = useState({
    placa: '',
    modelo: '',
    marca: '',
    ano: '',
    imei_rastreador: '',
    chip_numero: '',
    operadora_chip: '',
    observacoes: '',
  })

  useEffect(() => {
    if (clientId) {
      fetchClientData()
      fetchVehicles()
    }
  }, [clientId])

  const fetchClientData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) throw error
      setClient(data)
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Erro ao buscar veículos:', error)
    }
  }

  const handleSaveVehicle = async () => {
    try {
      const vehicleData = {
        client_id: clientId,
        placa: vehicleForm.placa.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        modelo: vehicleForm.modelo,
        marca: vehicleForm.marca || null,
        ano: vehicleForm.ano ? parseInt(vehicleForm.ano) : null,
        imei_rastreador: vehicleForm.imei_rastreador.replace(/\D/g, ''),
        chip_numero: vehicleForm.chip_numero,
        operadora_chip: vehicleForm.operadora_chip || null,
        observacoes: vehicleForm.observacoes || null,
      }

      // Validações
      if (vehicleData.placa.length !== 7) {
        alert('Placa deve ter 7 caracteres')
        return
      }

      if (vehicleData.imei_rastreador.length !== 15) {
        alert('IMEI deve ter 15 dígitos')
        return
      }

      if (editingVehicle) {
        // Editar - remover client_id do update
        const { client_id, ...updateData } = vehicleData
        const { error } = await supabase
          .from('vehicles')
          .update(updateData as any)
          .eq('id', editingVehicle.id)

        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase.from('vehicles').insert(vehicleData as any)

        if (error) throw error
      }

      // Resetar form e fechar modal
      setShowVehicleModal(false)
      setEditingVehicle(null)
      setVehicleForm({
        placa: '',
        modelo: '',
        marca: '',
        ano: '',
        imei_rastreador: '',
        chip_numero: '',
        operadora_chip: '',
        observacoes: '',
      })

      // Recarregar veículos
      fetchVehicles()
    } catch (error: any) {
      console.error('Erro ao salvar veículo:', error)
      alert(error.message || 'Erro ao salvar veículo')
    }
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setVehicleForm({
      placa: vehicle.placa,
      modelo: vehicle.modelo,
      marca: vehicle.marca || '',
      ano: vehicle.ano?.toString() || '',
      imei_rastreador: vehicle.imei_rastreador,
      chip_numero: vehicle.chip_numero,
      operadora_chip: vehicle.operadora_chip || '',
      observacoes: vehicle.observacoes || '',
    })
    setShowVehicleModal(true)
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId)

      if (error) throw error
      fetchVehicles()
    } catch (error) {
      console.error('Erro ao excluir veículo:', error)
      alert('Erro ao excluir veículo')
    }
  }

  const handleToggleVehicleStatus = async (vehicle: Vehicle) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ ativo: !vehicle.ativo })
        .eq('id', vehicle.id)

      if (error) throw error
      fetchVehicles()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cliente não encontrado</p>
        <Button
          variant="primary"
          onClick={() => router.push('/clientes')}
          className="mt-4"
        >
          Voltar para Clientes
        </Button>
      </div>
    )
  }

  // Aba de Informações do Cliente
  const informacoesTab = (
    <div className="space-y-6">
      <Card title="Dados Principais">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Pessoa
            </label>
            <p className="mt-1 text-sm text-gray-900">{client.tipo_pessoa}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {client.tipo_pessoa === 'Física' ? 'CPF' : 'CNPJ'}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {formatCPFCNPJ(client.cpf_cnpj)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {client.tipo_pessoa === 'Física' ? 'Nome' : 'Razão Social'}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {client.nome_razao_social}
            </p>
          </div>
          {client.nome_fantasia && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome Fantasia
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {client.nome_fantasia}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <p className="mt-1">
              <Badge
                variant={
                  client.status === 'Ativo'
                    ? 'success'
                    : client.status === 'Inativo'
                    ? 'warning'
                    : 'danger'
                }
              >
                {client.status}
              </Badge>
            </p>
          </div>
        </div>
      </Card>

      <Card title="Contato">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <p className="mt-1 text-sm text-gray-900">{client.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Telefone Principal
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {formatPhone(client.telefone_principal)}
            </p>
          </div>
          {client.telefone_secundario && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telefone Secundário
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {formatPhone(client.telefone_secundario)}
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Endereço">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">CEP</label>
            <p className="mt-1 text-sm text-gray-900">{formatCEP(client.cep)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Logradouro
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {client.logradouro}, {client.numero}
            </p>
          </div>
          {client.complemento && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Complemento
              </label>
              <p className="mt-1 text-sm text-gray-900">{client.complemento}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bairro
            </label>
            <p className="mt-1 text-sm text-gray-900">{client.bairro}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cidade
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {client.cidade} - {client.uf}
            </p>
          </div>
        </div>
      </Card>

      <Card title="Informações Financeiras">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Valor Mensalidade
            </label>
            <p className="mt-1 text-lg font-semibold text-green-600">
              {formatCurrency(client.valor_mensalidade)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Dia de Cobrança
            </label>
            <p className="mt-1 text-sm text-gray-900">
              Dia {client.dia_cobranca} de cada mês
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Forma de Pagamento Preferida
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {client.forma_pagamento_preferida}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Situação Assinatura
            </label>
            <p className="mt-1">
              <Badge
                variant={
                  client.situacao_assinatura === 'Ativa'
                    ? 'success'
                    : client.situacao_assinatura === 'Pausada'
                    ? 'warning'
                    : 'danger'
                }
              >
                {client.situacao_assinatura}
              </Badge>
            </p>
          </div>
          {client.proxima_cobranca && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Próxima Cobrança
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(client.proxima_cobranca)}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )

  // Aba de Veículos
  const veiculosTab = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Veículos do Cliente
          </h3>
          <p className="text-sm text-gray-500">
            {vehicles.length} veículo(s) cadastrado(s)
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingVehicle(null)
            setVehicleForm({
              placa: '',
              modelo: '',
              marca: '',
              ano: '',
              imei_rastreador: '',
              chip_numero: '',
              operadora_chip: '',
              observacoes: '',
            })
            setShowVehicleModal(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Veículo
        </Button>
      </div>

      {vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-gray-400" />
                      <h4 className="font-semibold text-gray-900">
                        {vehicle.placa}
                      </h4>
                      <Badge variant={vehicle.ativo ? 'success' : 'danger'}>
                        {vehicle.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {vehicle.marca} {vehicle.modelo}
                      {vehicle.ano ? ` - ${vehicle.ano}` : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">IMEI:</span>
                    <span className="font-mono text-gray-900">
                      {vehicle.imei_rastreador}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Chip:</span>
                    <span className="text-gray-900">{vehicle.chip_numero}</span>
                  </div>
                  {vehicle.operadora_chip && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Operadora:</span>
                      <span className="text-gray-900">
                        {vehicle.operadora_chip}
                      </span>
                    </div>
                  )}
                  {vehicle.observacoes && (
                    <div className="pt-2 border-t">
                      <span className="text-gray-500">Observações:</span>
                      <p className="text-gray-900 mt-1">{vehicle.observacoes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditVehicle(vehicle)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVehicleStatus(vehicle)}
                    className="flex-1"
                  >
                    {vehicle.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum veículo cadastrado</p>
            <Button
              variant="primary"
              onClick={() => setShowVehicleModal(true)}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Veículo
            </Button>
          </div>
        </Card>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/clientes')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.nome_razao_social}
            </h1>
            <p className="text-gray-600">{formatCPFCNPJ(client.cpf_cnpj)}</p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push(`/clientes/${clientId}/editar`)}
        >
          <Edit className="h-5 w-5 mr-2" />
          Editar Cliente
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'informacoes',
            label: 'Informações',
            icon: <User className="h-4 w-4" />,
            content: informacoesTab,
          },
          {
            id: 'veiculos',
            label: 'Veículos',
            icon: <Car className="h-4 w-4" />,
            content: veiculosTab,
          },
          {
            id: 'faturas',
            label: 'Faturas',
            icon: <FileText className="h-4 w-4" />,
            content: (
              <Card>
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Gerenciamento de faturas em desenvolvimento</p>
                </div>
              </Card>
            ),
          },
        ]}
        defaultTab="informacoes"
      />

      {/* Modal de Veículo */}
      <Modal
        isOpen={showVehicleModal}
        onClose={() => {
          setShowVehicleModal(false)
          setEditingVehicle(null)
        }}
        title={editingVehicle ? 'Editar Veículo' : 'Adicionar Veículo'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Placa"
              value={vehicleForm.placa}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, placa: e.target.value })
              }
              placeholder="ABC1234"
              maxLength={7}
              required
            />
            <Input
              label="Ano"
              type="number"
              value={vehicleForm.ano}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, ano: e.target.value })
              }
              placeholder="2024"
              min="1900"
              max="2100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Marca"
              value={vehicleForm.marca}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, marca: e.target.value })
              }
              placeholder="Fiat, VW, Chevrolet..."
            />
            <Input
              label="Modelo"
              value={vehicleForm.modelo}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, modelo: e.target.value })
              }
              placeholder="Gol, Uno, Corsa..."
              required
            />
          </div>

          <Input
            label="IMEI do Rastreador"
            value={vehicleForm.imei_rastreador}
            onChange={(e) =>
              setVehicleForm({
                ...vehicleForm,
                imei_rastreador: e.target.value.replace(/\D/g, ''),
              })
            }
            placeholder="123456789012345"
            maxLength={15}
            helperText="15 dígitos"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Número do Chip"
              value={vehicleForm.chip_numero}
              onChange={(e) =>
                setVehicleForm({ ...vehicleForm, chip_numero: e.target.value })
              }
              placeholder="(11) 98765-4321"
              required
            />
            <Input
              label="Operadora"
              value={vehicleForm.operadora_chip}
              onChange={(e) =>
                setVehicleForm({
                  ...vehicleForm,
                  operadora_chip: e.target.value,
                })
              }
              placeholder="Vivo, Claro, Tim..."
            />
          </div>

          <Input
            label="Observações"
            value={vehicleForm.observacoes}
            onChange={(e) =>
              setVehicleForm({ ...vehicleForm, observacoes: e.target.value })
            }
            placeholder="Informações adicionais sobre o veículo..."
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowVehicleModal(false)
                setEditingVehicle(null)
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveVehicle}
              className="flex-1"
            >
              {editingVehicle ? 'Salvar Alterações' : 'Adicionar Veículo'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
