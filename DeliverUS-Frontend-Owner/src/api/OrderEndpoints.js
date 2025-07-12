import { patch } from './helpers/ApiRequestsHelper'

function forward (id) {
  return patch(`orders/${id}/forward`)
}

function backward (id) {
  return patch(`orders/${id}/backward`)
}

export { forward, backward }
