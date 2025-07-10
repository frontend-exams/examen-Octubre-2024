import { patch } from './helpers/ApiRequestsHelper'

// Avanzar el estado
function forward (id) {
  return patch(`orders/${id}/forward`)
}
// Retroceder el estado
function backward (id) {
  return patch(`orders/${id}/backward`)
}

export { forward, backward }
