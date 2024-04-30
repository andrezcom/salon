import { expert } from '../../types.'

import expertData from './experts.json'

const experts: expert[] = expertData


export const getExperts = (): expert[] => experts;

export const findExpertById = (id: number): expert | undefined => {
  const data = expertData.find(e => e.id === id)
  return data
}

export const addExpert = (name: string, email: string, document: number, movil: string, active: boolean) => {
  const newExpert = {
    id: experts.length + 1,
    name,
    email,
    document,
    movil,
    active,
  }
  experts.push(newExpert)
  return newExpert
} 