/**
 * useOrders Hook
 * Gerencia estado e operações de pedidos
 */

import { useState, useCallback } from 'react'
import { 
  createOrder, 
  getUserOrders, 
  getAllOrders, 
  updateOrderStatus,
  uploadMotoImage 
} from '../services/orderService'
import { useAuth } from '../context/AuthContext'

export const useOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  // Buscar pedidos do usuário
  const fetchUserOrders = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    const { data, error } = await getUserOrders(user.id)
    
    if (error) {
      setError(error.message)
    } else {
      setOrders(data || [])
    }
    
    setLoading(false)
  }, [user])

  // Buscar todos pedidos (admin)
  const fetchAllOrders = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await getAllOrders()
    
    if (error) {
      setError(error.message)
    } else {
      setOrders(data || [])
    }
    
    setLoading(false)
  }, [])

  // Criar novo pedido
  const submitOrder = useCallback(async (orderData, imageFile) => {
    if (!user) {
      return { error: { message: 'Usuário não autenticado' } }
    }

    setLoading(true)
    setError(null)

    try {
      let imageUrl = null

      // Upload da imagem se fornecida
      if (imageFile) {
        const { data: uploadedUrl, error: uploadError } = await uploadMotoImage(imageFile, user.id)
        if (uploadError) throw uploadError
        imageUrl = uploadedUrl
      }

      // Criar pedido
      const { data, error } = await createOrder({
        ...orderData,
        user_id: user.id,
        foto_moto_url: imageUrl,
      })

      if (error) throw error

      // Atualizar lista de pedidos
      setOrders(prev => [data, ...prev])
      
      setLoading(false)
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return { data: null, error: err }
    }
  }, [user])

  // Atualizar status (admin)
  const changeStatus = useCallback(async (orderId, newStatus) => {
    setLoading(true)
    setError(null)

    const { data, error } = await updateOrderStatus(orderId, newStatus)
    
    if (error) {
      setError(error.message)
    } else {
      // Atualizar lista local
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
    }
    
    setLoading(false)
    return { data, error }
  }, [])

  return {
    orders,
    loading,
    error,
    fetchUserOrders,
    fetchAllOrders,
    submitOrder,
    changeStatus,
  }
}

export default useOrders
