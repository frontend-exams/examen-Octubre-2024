// TODO: Endpoints, hay que hacerlo completo.
import { patch } from './helpers/ApiRequestsHelper'

// TODO: [Octubre 2024]
function forward (id) {
  return patch(`orders/${id}/forward`)
}

function backward (id) {
  return patch(`orders/${id}/backward`)
}
export { forward, backward }
