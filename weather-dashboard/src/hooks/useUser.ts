import { api } from "@/lib/api";
import type { UpdateUserDto, UserResponse } from "@/lib/validations/auth.dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedUser } from "./helpers";


const patchUser = async (userId: string, data: UpdateUserDto): Promise<UserResponse> => {
  const { data: user } = await api.patch<UserResponse>(`/user/update/${userId}`, data)
  return user
}

const deleteUser = async (userId:string) => {
  const res = await api.delete(`/user/delete/${userId}`)
  if(res.status !== 200) throw new Error('Falha ao deletar usuário')
  
  return res.statusText
}

const reactivateUser = async (userId: string): Promise<UserResponse> => {
  const { data } = await api.patch<UserResponse>(`/user/reactivate/${userId}`)
  return data
}

export default function useUser() {
  const queryClient = useQueryClient()
  const user = useAuthenticatedUser()

  const updateMutation = useMutation<UserResponse, Error, UpdateUserDto>({
    mutationFn: async (dto) => {
      if(!user?.id) throw new Error('usuário não autenticado')
      
      return patchUser(user.id, dto)
    },

    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserResponse>(['user', updatedUser.id], updatedUser)
    }
  })

  const deleteMutation = useMutation<string, Error, string>({
    mutationFn: deleteUser,

    onSuccess: (_statusText, userId) => {
      queryClient.removeQueries({ queryKey: ['user', userId] })
    }

  })

  const reactivateMutation = useMutation<UserResponse, Error, string>({
    // variables = userId
    mutationFn: reactivateUser,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserResponse>(['user', updatedUser.id], updatedUser)
    },
  })
  return {
    user,

    // update
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // delete
    deleteAccount: deleteMutation.mutateAsync, 
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // reactivate
    reactivateAccount: reactivateMutation.mutateAsync, 
    isReactivating: reactivateMutation.isPending,
    reactivateError: reactivateMutation.error,
  }
  
}