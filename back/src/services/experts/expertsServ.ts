import { expert } from '../../types.'

import expertData from './experts.json'

const experts: expert[] = expertData


export const getExperts = (): expert[] => experts;
export const addExperts = (): undefined => undefined;